import { NextRequest, NextResponse } from 'next/server';

// Simple email simulation for demo
const resetTokens = new Map();

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { message: 'Email is required' },
                { status: 400 }
            );
        }

        // Simulate user lookup
        const userExists = email.includes('@'); // Simple validation
        if (!userExists) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        // Generate reset token
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

        resetTokens.set(token, { email, expiresAt });

        // In production, send email with reset link
        console.log(`Password reset email sent to: ${email}`);
        console.log(`Reset link: /reset-password/${token}`);

        return NextResponse.json({
            message: 'Password reset email sent',
            token // For demo purposes only
        });
    } catch (error) {
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}