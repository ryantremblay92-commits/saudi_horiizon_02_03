import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Invoice from '@/lib/db/models/Invoice';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
        }

        const invoice = await Invoice.findById(id);

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        // Return a sanitized version of the invoice for public view
        // We don't want to expose createBy or internal MongoDB fields necessarily
        return NextResponse.json({
            _id: invoice._id,
            invoiceNumber: invoice.invoiceNumber,
            customer: invoice.customer,
            items: invoice.items,
            subtotal: invoice.subtotal,
            vatRate: invoice.vatRate,
            vatAmount: invoice.vatAmount,
            totalAmount: invoice.totalAmount,
            currency: invoice.currency,
            status: invoice.status,
            dueDate: invoice.dueDate,
            paidAt: invoice.paidAt,
            notes: invoice.notes,
            createdAt: invoice.createdAt,
        });

    } catch (error: any) {
        console.error('Public invoice fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
