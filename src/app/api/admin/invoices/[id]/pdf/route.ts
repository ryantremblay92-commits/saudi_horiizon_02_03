import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Invoice from '@/lib/db/models/Invoice';
import { generateInvoicePDFServer } from '@/lib/invoices/generatePDFServer';
import { verifyAuth } from '@/lib/auth/middleware';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET — Download invoice as PDF
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        // Support token in query string for direct browser downloads (window.open)
        const url = new URL(req.url);
        const queryToken = url.searchParams.get('token');
        let auth;
        if (queryToken) {
            // Temporarily add token to header for verifyAuth
            const headers = new Headers(req.headers);
            headers.set('Authorization', `Bearer ${queryToken}`);
            const modifiedReq = new NextRequest(req.url, { headers });
            auth = await verifyAuth(modifiedReq);
        } else {
            auth = await verifyAuth(req);
        }
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const { id } = await params;
        const invoice = await Invoice.findById(id).lean();
        if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

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
                'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
                'Content-Length': String(pdfBuffer.length),
            },
        });
    } catch (error: any) {
        console.error('CRITICAL PDF ERROR:', error);
        if (error.stack) console.error(error.stack);
        return NextResponse.json({
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
