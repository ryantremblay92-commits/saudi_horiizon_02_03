import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import QuoteRequest from '@/lib/db/models/QuoteRequest';
import { verifyAccessToken } from '@/lib/auth/jwt';

// POST /api/user/quotes/message — user sends a reply
export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        let payload: any;
        try {
            payload = verifyAccessToken(token);
        } catch {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const userId = payload.sub;
        const { quoteId, text } = await request.json();

        if (!quoteId || !text) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        const quote = await QuoteRequest.findById(quoteId);
        if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        if (quote.userId && quote.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        quote.messages.push({
            sender: 'user',
            text,
            createdAt: new Date()
        });

        // Optional: change status to 'pending' if it was responded, to alert admin?
        // Let's keep status same but admin will see new messages

        await quote.save();
        return NextResponse.json(quote);
    } catch (error: any) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
