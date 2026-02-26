import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory user store for demo
let users = [
    {
        id: 1,
        email: 'admin@saudifresh.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin',
        phone: '+966500000000',
    },
];

export async function POST(request: NextRequest) {
    try {
        const { name, email, password, phone } = await request.json();

        if (!name || !email || !password) {
            return NextResponse.json(
                { message: 'Name, email, and password are required' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            return NextResponse.json(
                { message: 'User already exists' },
                { status: 409 }
            );
        }

        // Create new user
        const newUser = {
            id: users.length + 1,
            email,
            password, // In production, hash the password
            name,
            role: 'user',
            phone: phone || '',
        };

        users.push(newUser);

        // Generate token
        const token = btoa(JSON.stringify({
            userId: newUser.id,
            email: newUser.email,
            role: newUser.role,
            exp: Date.now() + 24 * 60 * 60 * 1000
        }));

        return NextResponse.json({
            token,
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                role: newUser.role,
            }
        });
    } catch (error) {
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
