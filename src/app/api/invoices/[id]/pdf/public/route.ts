import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Invoice from '@/lib/db/models/Invoice';
import { generateInvoicePDFServer } from '@/lib/invoices/generatePDFServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET — Download invoice as PDF (Public)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await params;

        // Find invoice - no auth required for public view if they have the ID
        // (Similar to how the public invoice detail route works)
        const invoice = await Invoice.findById(id).lean();

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        const pdfBuffer = await generateInvoicePDFServer({
            invoiceNumber: invoice.invoiceNumber,
            date: new Date(invoice.createdAt).toLocaleDateString('en-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }),
            dueDate: invoice.dueDate
                ? new Date(invoice.dueDate).toLocaleDateString('en-SA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                })
                : undefined,
            customer: invoice.customer,
            items: invoice.items,
            subtotal: invoice.subtotal,
            vatRate: invoice.vatRate,
            vatAmount: invoice.vatAmount,
            totalAmount: invoice.totalAmount,
            currency: invoice.currency,
            notes: invoice.notes,
            status: invoice.status,
        });

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${invoice.invoiceNumber}.pdf"`,
                'Content-Length': String(pdfBuffer.length),
            },
        });
    } catch (error: any) {
        console.error('Public PDF error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
