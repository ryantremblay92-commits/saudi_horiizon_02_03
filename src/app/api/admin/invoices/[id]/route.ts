import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Invoice from '@/lib/db/models/Invoice';
import { verifyAuth } from '@/lib/auth/middleware';

// GET — Single invoice
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await verifyAuth(req);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const { id } = await params;
        const invoice = await Invoice.findById(id).lean();
        if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

        return NextResponse.json({ invoice });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH — Update invoice status or fields
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await verifyAuth(req);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const { id } = await params;
        const body = await req.json();

        const updateData: any = {};
        if (body.status) updateData.status = body.status;
        if (body.notes !== undefined) updateData.notes = body.notes;
        if (body.dueDate) updateData.dueDate = new Date(body.dueDate);
        if (body.status === 'paid') updateData.paidAt = new Date();
        if (body.status === 'sent') updateData.sentAt = new Date();

        const invoice = await Invoice.findByIdAndUpdate(id, updateData, { new: true }).lean();
        if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

        return NextResponse.json({ invoice });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE — Remove invoice
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await verifyAuth(req);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const { id } = await params;
        const invoice = await Invoice.findByIdAndDelete(id);
        if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

        return NextResponse.json({ message: 'Invoice deleted' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
