import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/notifications/userNotifications';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ message: 'Email is required' }, { status: 400 });
        }

        const user = await User.findOne({ email });

        // For security, don't reveal if a user exists or not
        if (!user || user.oauthProvider) {
            return NextResponse.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
        }

        // Generate token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Set expiry (1 hour)
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = new Date(Date.now() + 3600000);

        await user.save();

        const resetLink = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

        await sendPasswordResetEmail(user.email, resetLink, user.profile?.name || 'User');

        return NextResponse.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}