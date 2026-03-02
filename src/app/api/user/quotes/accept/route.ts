import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import QuoteRequest from '@/lib/db/models/QuoteRequest';
import { verifyAccessToken } from '@/lib/auth/jwt';

// POST /api/user/quotes/accept  — user accepts a responded quote
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
        const { quoteId } = await request.json();

        if (!quoteId) {
            return NextResponse.json({ error: 'quoteId is required' }, { status: 400 });
        }

        // Find the quote and verify ownership
        const quote = await QuoteRequest.findById(quoteId);
        if (!quote) {
            return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        }
        if (quote.userId && quote.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (quote.status !== 'responded') {
            return NextResponse.json({ error: 'Quote is not in a responded state' }, { status: 400 });
        }
        if (quote.validUntil && new Date(quote.validUntil) < new Date()) {
            return NextResponse.json({ error: 'Quote has expired' }, { status: 400 });
        }

        const updated = await QuoteRequest.findByIdAndUpdate(
            quoteId,
            { status: 'accepted', acceptedAt: new Date() },
            { new: true }
        );

        return NextResponse.json({ quote: updated });
    } catch (error: any) {
        console.error('Error accepting quote:', error);
        return NextResponse.json({ error: 'Failed to accept quote' }, { status: 500 });
    }
}

// POST /api/user/quotes/decline
export async function DELETE(request: NextRequest) {
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
        const { quoteId } = await request.json();

        const quote = await QuoteRequest.findById(quoteId);
        if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        if (quote.userId && quote.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const updated = await QuoteRequest.findByIdAndUpdate(
            quoteId,
            { status: 'cancelled' },
            { new: true }
        );

        return NextResponse.json({ quote: updated });
    } catch (error: any) {
        console.error('Error declining quote:', error);
        return NextResponse.json({ error: 'Failed to decline quote' }, { status: 500 });
    }
}
