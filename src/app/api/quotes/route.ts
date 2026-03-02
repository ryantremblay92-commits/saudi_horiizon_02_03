import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import QuoteRequest from '@/lib/db/models/QuoteRequest';
import { notifyQuoteRequest } from '@/lib/notifications/adminNotifications';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const body = await request.json();

        const { companyName, contactPerson, phone, email, projectType, items, quantities, timeline, notes } = body;

        // Try to get userId from token if present
        let userId: string | undefined;
        try {
            const authHeader = request.headers.get('Authorization');
            if (authHeader?.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                const payload = verifyAccessToken(token);
                userId = payload.sub;
                console.log('Quote Request: Authenticated user found:', userId);
            } else {
                console.log('Quote Request: No Bearer token found in header');
            }
        } catch (e: any) {
            console.error('Quote Request: Token verification failed:', e.message);
            // Token invalid or missing, continue as guest
        }

        if (!companyName || !contactPerson || !phone || !email || !items) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const quoteRequest = await QuoteRequest.create({
            userId,
            companyName,
            contactPerson,
            phone,
            email,
            projectType,
            items,
            quantities,
            timeline,
            notes,
            status: 'pending'
        });

        // Trigger admin notification in background (non-blocking)
        notifyQuoteRequest(companyName, contactPerson, { email, phone, items })
            .catch(err => console.error('Background notification failed:', err));

        return NextResponse.json(
            { message: 'Quote request submitted successfully', id: quoteRequest._id },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error submitting quote request:', error);
        return NextResponse.json(
            { error: 'Failed to submit quote request' },
            { status: 500 }
        );
    }
}
