import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import Product from '@/lib/db/models/Product';
import Order from '@/lib/db/models/Order';
import QuoteRequest from '@/lib/db/models/QuoteRequest';
import Banner from '@/lib/db/models/Banner';
import { verifyAdminToken } from '@/lib/auth/adminAuth';

export async function GET(request: NextRequest) {
    const authResult = await verifyAdminToken(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    try {
        await connectDB();

        const [totalUsers, totalProducts, totalOrders] = await Promise.all([
            User.countDocuments(),
            Product.countDocuments(),
            Order.countDocuments()
        ]);

        // Date boundaries
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // New users registered this month
        const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: startOfThisMonth } });

        // Low stock products (stock <= 5)
        const lowStockCount = await Product.countDocuments({ stock: { $lte: 5 } });

        // Total revenue
        const revenueResult = await Order.aggregate([
            { $match: { status: { $ne: 'cancelled' } } },
            { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
        ]);
        const totalRevenue = revenueResult[0]?.totalRevenue || 0;

        // This month vs last month — revenue and order count
        const [thisMonthData, lastMonthData] = await Promise.all([
            Order.aggregate([
                { $match: { createdAt: { $gte: startOfThisMonth }, status: { $ne: 'cancelled' } } },
                { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
            ]),
            Order.aggregate([
                { $match: { createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth }, status: { $ne: 'cancelled' } } },
                { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
            ])
        ]);
        const thisRevenue = thisMonthData[0]?.revenue || 0;
        const lastRevenue = lastMonthData[0]?.revenue || 0;
        const thisOrders = thisMonthData[0]?.count || 0;
        const lastOrders = lastMonthData[0]?.count || 0;

        // Compute % change helpers (null = not enough data)
        const pct = (curr: number, prev: number): number | null =>
            prev === 0 ? null : Math.round(((curr - prev) / prev) * 100);

        const revenueChange = pct(thisRevenue, lastRevenue);
        const ordersChange = pct(thisOrders, lastOrders);

        // Top products
        const topProducts = await Order.aggregate([
            { $unwind: '$items' },
            { $group: { _id: '$items.name', totalSold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
            { $sort: { totalSold: -1 } },
            { $limit: 5 }
        ]);

        // Monthly revenue (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const monthlyRevenue = await Order.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo }, status: { $ne: 'cancelled' } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, sales: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        // Order status breakdown
        const orderStatusBreakdown = await Order.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Recent orders (for activity)
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(6)
            .populate('user', 'email name')
            .select('_id user totalAmount status createdAt')
            .lean();

        // Recent products added
        const recentProducts = await Product.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('_id name category price createdAt')
            .lean();

        // Recent users registered
        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(4)
            .select('_id email name createdAt')
            .lean();

        // Recent quote requests
        const recentQuotes = await QuoteRequest.find()
            .sort({ createdAt: -1 })
            .limit(4)
            .select('_id companyName contactPerson status createdAt')
            .lean();

        // Active banners (running right now)
        const now2 = new Date();
        const activeBanners = await Banner.find({ isActive: true })
            .sort({ createdAt: -1 })
            .select('_id title subtitle position link ctaText isActive createdAt')
            .lean();

        // Recent banners created (for the activity feed)
        const recentBanners = await Banner.find()
            .sort({ createdAt: -1 })
            .limit(4)
            .select('_id title position isActive createdAt')
            .lean();

        // Build unified activity feed — merge + sort by date
        const activities = [
            ...recentOrders.map((o: any) => ({
                type: 'order',
                id: o._id.toString(),
                title: `New order placed`,
                subtitle: (o.user as any)?.email || 'Guest',
                meta: `SAR ${o.totalAmount?.toLocaleString()}`,
                status: o.status,
                createdAt: o.createdAt,
                href: '/admin/orders',
            })),
            ...recentProducts.map((p: any) => ({
                type: 'product',
                id: p._id.toString(),
                title: `Product added`,
                subtitle: p.name,
                meta: p.category,
                status: null,
                createdAt: p.createdAt,
                href: '/admin/products',
            })),
            ...recentUsers.map((u: any) => ({
                type: 'user',
                id: u._id.toString(),
                title: `New user registered`,
                subtitle: u.email,
                meta: u.name || '',
                status: null,
                createdAt: u.createdAt,
                href: '/admin/users',
            })),
            ...recentQuotes.map((q: any) => ({
                type: 'quote',
                id: q._id.toString(),
                title: `Quote request received`,
                subtitle: q.companyName,
                meta: q.contactPerson,
                status: q.status,
                createdAt: q.createdAt,
                href: '/admin/quotes',
            })),
            ...recentBanners.map((b: any) => ({
                type: 'banner',
                id: b._id.toString(),
                title: `Banner ${b.isActive ? 'activated' : 'created'}`,
                subtitle: b.title,
                meta: b.position,
                status: b.isActive ? 'active' : 'inactive',
                createdAt: b.createdAt,
                href: '/admin/banners',
            })),
        ]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 12);

        return NextResponse.json({
            totalUsers,
            totalProducts,
            totalOrders,
            totalRevenue,
            monthlyRevenue,
            recentOrders,
            topProducts,
            orderStatusBreakdown,
            activities,
            activeBanners,
            // Real stat card metadata
            newUsersThisMonth,
            lowStockCount,
            revenueChange,
            ordersChange,
        });
    } catch (error: unknown) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard statistics' }, { status: 500 });
    }
}
