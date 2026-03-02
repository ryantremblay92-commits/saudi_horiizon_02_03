import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { verifyAuth } from '@/lib/auth/middleware';

// GET /api/users/wishlist - Get user's wishlist (array of product IDs)
export async function GET(request: NextRequest) {
    try {
        await connectDB();
        const user = await verifyAuth(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const dbUser = await User.findById(user.sub).select('wishlist');
        if (!dbUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(dbUser.wishlist || []);
    } catch (error: unknown) {
        console.error('Error fetching wishlist:', error);
        return NextResponse.json(
            { error: 'Failed to fetch wishlist' },
            { status: 500 }
        );
    }
}

// POST /api/users/wishlist - Add a product to wishlist
export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const user = await verifyAuth(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { productId } = body;

        if (!productId) {
            return NextResponse.json(
                { error: 'Product ID is required' },
                { status: 400 }
            );
        }

        const dbUser = await User.findById(user.sub);
        if (!dbUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Add to wishlist if not already present
        if (!dbUser.wishlist) {
            dbUser.wishlist = [];
        }

        if (!dbUser.wishlist.includes(productId)) {
            dbUser.wishlist.push(productId);
            await dbUser.save();
        }

        return NextResponse.json(dbUser.wishlist);
    } catch (error: unknown) {
        console.error('Error adding to wishlist:', error);
        return NextResponse.json(
            { error: 'Failed to add to wishlist' },
            { status: 500 }
        );
    }
}
