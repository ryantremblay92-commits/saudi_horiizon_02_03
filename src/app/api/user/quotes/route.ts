import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import QuoteRequest from '@/lib/db/models/QuoteRequest';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        // Authenticate user
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        let payload;
        try {
            payload = verifyAccessToken(token);
        } catch (e) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const userId = payload.sub;

        const quotes = await QuoteRequest.find({ userId })
            .sort({ createdAt: -1 });

        return NextResponse.json({ quotes });
    } catch (error: any) {
        console.error('Error fetching user quotes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch quotes' },
            { status: 500 }
        );
    }
}
