import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import QuoteRequest from '@/lib/db/models/QuoteRequest';
import { notifyQuoteRequest } from '@/lib/notifications/adminNotifications';

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const body = await request.json();

        const { companyName, contactPerson, phone, email, projectType, items, quantities, timeline, notes } = body;

        if (!companyName || !contactPerson || !phone || !email || !items) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const quoteRequest = await QuoteRequest.create({
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

        // Trigger admin notification
        await notifyQuoteRequest(companyName, contactPerson);

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
