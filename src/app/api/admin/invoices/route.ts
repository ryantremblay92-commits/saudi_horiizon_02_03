import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Invoice from '@/lib/db/models/Invoice';
import Order from '@/lib/db/models/Order';
import QuoteRequest from '@/lib/db/models/QuoteRequest';
import { verifyAuth } from '@/lib/auth/middleware';

// GET — List all invoices (with optional filters)
export async function GET(req: NextRequest) {
    try {
        const auth = await verifyAuth(req);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const sourceType = searchParams.get('sourceType');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const filter: any = {};
        if (status && status !== 'all') filter.status = status;
        if (sourceType && sourceType !== 'all') filter.sourceType = sourceType;
        if (search) {
            filter.$or = [
                { invoiceNumber: { $regex: search, $options: 'i' } },
                { 'customer.name': { $regex: search, $options: 'i' } },
                { 'customer.company': { $regex: search, $options: 'i' } },
                { 'customer.email': { $regex: search, $options: 'i' } },
            ];
        }

        const total = await Invoice.countDocuments(filter);
        const invoices = await Invoice.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        return NextResponse.json({
            invoices,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error: any) {
        console.error('Error fetching invoices:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST — Create a new invoice from an order or quote
export async function POST(req: NextRequest) {
    try {
        const auth = await verifyAuth(req);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const body = await req.json();
        const { sourceType, sourceId, items, notes, dueDate, vatRate = 15 } = body;

        if (!sourceType || !sourceId) {
            return NextResponse.json({ error: 'sourceType and sourceId are required' }, { status: 400 });
        }

        // Get customer info from source
        let customer: any = {};

        if (sourceType === 'order') {
            const order = await Order.findById(sourceId).populate('user', 'email profile');
            if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

            const user = order.user as any;
            customer = {
                name: order.shippingAddress?.name || user?.profile?.name || user?.email || 'Customer',
                company: order.shippingAddress?.company || '',
                email: order.shippingAddress?.email || user?.email || '',
                phone: order.shippingAddress?.phone || '',
                address: [
                    order.shippingAddress?.street1,
                    order.shippingAddress?.street2,
                    order.shippingAddress?.city,
                    order.shippingAddress?.state,
                    order.shippingAddress?.zip,
                    order.shippingAddress?.country,
                ].filter(Boolean).join(', '),
            };

            // If no items provided, derive from order
            if (!items || items.length === 0) {
                const orderItems = order.items.map((item: any) => ({
                    description: item.name || `Product (${item.product})`,
                    quantity: item.quantity,
                    unitPrice: item.price,
                    total: item.quantity * item.price,
                }));
                body.items = orderItems;
            }
        } else if (sourceType === 'quote') {
            const quote = await QuoteRequest.findById(sourceId);
            if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });

            customer = {
                name: quote.contactPerson,
                company: quote.companyName,
                email: quote.email,
                phone: quote.phone,
            };

            // If no items provided, derive from quote
            if (!items || items.length === 0) {
                const quotedPrice = quote.quotedPrice || 0;
                body.items = [{
                    description: quote.items || 'Quoted Items',
                    quantity: 1,
                    unitPrice: quotedPrice,
                    total: quotedPrice,
                }];
            }
        }

        // Calculate totals
        const invoiceItems = body.items || items || [];
        const subtotal = invoiceItems.reduce((sum: number, item: any) => sum + (item.total || item.quantity * item.unitPrice), 0);
        const vatAmount = Math.round(subtotal * vatRate / 100 * 100) / 100;
        const totalAmount = Math.round((subtotal + vatAmount) * 100) / 100;

        // Generate invoice number manually to avoid middleware issues
        const year = new Date().getFullYear();
        const count = await Invoice.countDocuments({
            invoiceNumber: { $regex: `^INV-${year}-` }
        });
        const invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`;

        const invoice = await Invoice.create({
            invoiceNumber,
            sourceType,
            sourceId,
            customer,
            items: invoiceItems,
            subtotal,
            vatRate,
            vatAmount,
            totalAmount,
            currency: 'SAR',
            status: 'draft',
            notes,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            createdBy: auth.sub,
        });

        return NextResponse.json({ invoice }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating invoice:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
