import { NextRequest, NextResponse } from 'next/server';

// Simple token storage (in production, use database)
const resetTokens = new Map();

export async function POST(request: NextRequest) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json(
                { message: 'Token and password are required' },
                { status: 400 }
            );
        }

        // Validate token
        const tokenData = resetTokens.get(token);
        if (!tokenData || Date.now() > tokenData.expiresAt) {
            return NextResponse.json(
                { message: 'Invalid or expired token' },
                { status: 400 }
            );
        }

        // In production, update user password in database
        console.log(`Password reset for: ${tokenData.email}`);

        // Remove used token
        resetTokens.delete(token);

        return NextResponse.json({
            message: 'Password reset successful'
        });
    } catch (error) {
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}