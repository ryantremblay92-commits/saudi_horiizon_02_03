import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Order from '@/lib/db/models/Order';
import User from '@/lib/db/models/User';
import { notifyNewOrder } from '@/lib/notifications/adminNotifications';
import { sendOrderConfirmationEmail } from '@/lib/notifications/userNotifications';

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const body = await request.json();
        const { userId, items, totalAmount, shippingAddress } = body;

        // Validation
        if (!userId || !items || !totalAmount || !shippingAddress) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Create order
        const order = await Order.create({
            user: userId,
            items,
            totalAmount,
            shippingAddress,
            status: 'pending'
        });

        // ─── NOTIFICATIONS ───────────────────────────────────────────────

        // Fetch expanded data for the email
        const populatedOrder = await Order.findById(order._id).populate('items.product');
        const user = await User.findById(userId);

        if (populatedOrder && (shippingAddress?.email || user?.email)) {
            const customerEmail = shippingAddress?.email || user?.email;
            const customerName = shippingAddress?.name || user?.profile?.name || 'Customer';

            // Send Confirmation Email to User (Non-blocking)
            sendOrderConfirmationEmail(customerEmail, customerName, populatedOrder)
                .catch(err => console.error('Order confirmation email failed:', err));
        }

        // Create admin notification for new order (Non-blocking)
        notifyNewOrder(
            order._id.toString(),
            totalAmount,
            shippingAddress?.email || user?.email
        ).catch(err => console.error('Admin order notification failed:', err));

        return NextResponse.json(order, { status: 201 });
    } catch (error: unknown) {
        console.error('Error creating order:', error);
        return NextResponse.json(
            { message: 'Failed to create order' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        let userId = searchParams.get('userId');
        const admin = searchParams.get('admin');

        // If admin parameter is set, return all orders (for admin panel)
        if (admin === 'true' || admin === '1') {
            const orders = await Order.find()
                .populate('items.product')
                .populate('user', 'email name')
                .sort({ createdAt: -1 });

            return NextResponse.json({ orders });
        }

        // If no userId provided, try to extract from auth token
        if (!userId) {
            const { verifyAuth } = await import('@/lib/auth/middleware');
            const user = await verifyAuth(request);
            if (user) {
                userId = user.sub;
            }
        }

        // Regular user order fetch requires userId
        if (!userId) {
            return NextResponse.json(
                { message: 'Authentication required to view orders' },
                { status: 401 }
            );
        }

        const orders = await Order.find({ user: userId })
            .populate('items.product')
            .sort({ createdAt: -1 });

        return NextResponse.json(orders);
    } catch (error: unknown) {
        console.error('Error fetching orders:', error);
        return NextResponse.json(
            { message: 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}
