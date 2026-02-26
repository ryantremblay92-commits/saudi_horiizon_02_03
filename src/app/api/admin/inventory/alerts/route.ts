import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Product from '@/lib/db/models/Product';
import { verifyAdminToken } from '@/lib/auth/adminAuth';

// GET /api/admin/inventory/alerts - Get stock alerts
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

        // Critical alerts (out of stock)
        const criticalAlerts = await Product.find({ stock: 0 })
            .select('name sku stock price category')
            .sort({ updatedAt: -1 });

        // Warning alerts (low stock - less than 10 units)
        const warningAlerts = await Product.find({
            stock: { $gt: 0, $lt: 10 }
        })
            .select('name sku stock price category')
            .sort({ stock: 1 });

        // Calculate alert statistics
        const alertStats = await Product.aggregate([
            {
                $group: {
                    _id: null,
                    totalCritical: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } },
                    totalWarning: { $sum: { $cond: [{ $and: [{ $gt: ['$stock', 0] }, { $lt: ['$stock', 10] }] }, 1, 0] } },
                    totalLowStock: { $sum: { $cond: [{ $lt: ['$stock', 10] }, 1, 0] } }
                }
            }
        ]);

        return NextResponse.json({
            critical: criticalAlerts,
            warning: warningAlerts,
            stats: alertStats[0] || { totalCritical: 0, totalWarning: 0, totalLowStock: 0 }
        });
    } catch (error: unknown) {
        console.error('Error fetching inventory alerts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch inventory alerts' },
            { status: 500 }
        );
    }
}

// POST /api/admin/inventory/alerts/notify - Send stock alert notifications
export async function POST(request: NextRequest) {
    const authResult = await verifyAdminToken(request);
    if (authResult.error) {
        return NextResponse.json(
            { error: authResult.error },
            { status: authResult.status }
        );
    }

    try {
        await connectDB();
        const { type } = await request.json();

        // Get alerts based on type
        let alerts;
        if (type === 'critical') {
            alerts = await Product.find({ stock: 0 });
        } else if (type === 'warning') {
            alerts = await Product.find({ stock: { $gt: 0, $lt: 10 } });
        } else {
            alerts = await Product.find({ stock: { $lt: 10 } });
        }

        return NextResponse.json({
            message: 'Stock alerts processed',
            alertsCount: alerts.length,
            alerts: alerts.map(p => ({
                name: p.name,
                sku: p.sku,
                stock: p.stock,
                price: p.price,
                category: p.category
            }))
        });
    } catch (error: unknown) {
        console.error('Error processing stock alerts:', error);
        return NextResponse.json(
            { error: 'Failed to process stock alerts' },
            { status: 500 }
        );
    }
}