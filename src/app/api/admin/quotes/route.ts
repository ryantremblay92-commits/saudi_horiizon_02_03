import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import QuoteRequest from '@/lib/db/models/QuoteRequest';
import { verifyAdminToken } from '@/lib/auth/adminAuth';

export async function GET(request: NextRequest) {
    const authResult = await verifyAdminToken(request);
    if (authResult.error) {
        return NextResponse.json(
            { error: authResult.error },
            { status: authResult.status }
        );
    }

    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '50');
        const page = parseInt(searchParams.get('page') || '1');
        const skip = (page - 1) * limit;

        const query: any = {};
        if (status && status !== 'all') {
            query.status = status;
        }

        const [quotes, total] = await Promise.all([
            QuoteRequest.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            QuoteRequest.countDocuments(query)
        ]);

        return NextResponse.json({
            quotes,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error: any) {
        console.error('Error fetching quotes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch quote requests' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    const authResult = await verifyAdminToken(request);
    if (authResult.error) {
        return NextResponse.json(
            { error: authResult.error },
            { status: authResult.status }
        );
    }

    try {
        await connectDB();
        const body = await request.json();
        const { id, status, adminResponse, quotedPrice, validUntil } = body;

        if (!id || !status) {
            return NextResponse.json(
                { error: 'ID and status are required' },
                { status: 400 }
            );
        }

        const updateFields: any = { status, adminResponse };
        if (quotedPrice !== undefined) updateFields.quotedPrice = quotedPrice;
        if (validUntil !== undefined) updateFields.validUntil = new Date(validUntil);

        const quote = await QuoteRequest.findById(id);
        if (quote && adminResponse) {
            quote.messages.push({
                sender: 'admin',
                text: adminResponse,
                createdAt: new Date()
            });
            quote.status = status;
            quote.adminResponse = adminResponse;
            if (quotedPrice !== undefined) quote.quotedPrice = quotedPrice;
            if (validUntil !== undefined) quote.validUntil = new Date(validUntil);
            await quote.save();
            return NextResponse.json(quote);
        }

        const updatedQuote = await QuoteRequest.findByIdAndUpdate(
            id,
            updateFields,
            { new: true }
        );

        if (!quote) {
            return NextResponse.json(
                { error: 'Quote request not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(quote);
    } catch (error: any) {
        console.error('Error updating quote:', error);
        return NextResponse.json(
            { error: 'Failed to update quote request' },
            { status: 500 }
        );
    }
}
