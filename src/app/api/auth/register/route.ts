import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';
import { sendWelcomeEmail } from '@/lib/notifications/userNotifications';
import { notifyNewUser } from '@/lib/notifications/adminNotifications';

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const { name, email, password, phone } = await request.json();

        if (!name || !email || !password) {
            return NextResponse.json(
                { message: 'Name, email, and password are required' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return NextResponse.json(
                { message: 'User with this email already exists' },
                { status: 409 }
            );
        }

        // Create new user
        const newUser = await User.create({
            email: email.toLowerCase(),
            password, // Mongoose pre-save hook will hash this
            profile: {
                name,
                phone: phone || '',
            },
            role: 'user',
        });

        // Generate tokens
        const accessToken = generateAccessToken(newUser);
        const refreshToken = generateRefreshToken(newUser);

        // Save refresh token
        newUser.refreshToken = refreshToken;
        await newUser.save();

        // --- Notifications ---

        // 1. Send Welcome Email to User (Non-blocking)
        sendWelcomeEmail(email, name).catch(err => console.error('Welcome email failed:', err));

        // 2. Notify Admin about new registration (Non-blocking)
        notifyNewUser(name, email).catch(err => console.error('Admin notification failed:', err));

        return NextResponse.json({
            token: accessToken,
            accessToken,
            refreshToken,
            user: {
                id: newUser._id,
                email: newUser.email,
                name: newUser.profile?.name || name,
                role: newUser.role,
            }
        }, { status: 201 });

    } catch (error: any) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { message: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
