import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { verifyAuth } from '@/lib/auth/middleware';

// DELETE /api/users/wishlist/[productId] - Remove a product from wishlist
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ productId: string }> }
) {
    try {
        await connectDB();
        const user = await verifyAuth(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { productId } = await params;

        const dbUser = await User.findById(user.sub);
        if (!dbUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        if (dbUser.wishlist) {
            dbUser.wishlist = dbUser.wishlist.filter((id: string) => id !== productId);
            await dbUser.save();
        }

        return NextResponse.json(dbUser.wishlist || []);
    } catch (error: unknown) {
        console.error('Error removing from wishlist:', error);
        return NextResponse.json(
            { error: 'Failed to remove from wishlist' },
            { status: 500 }
        );
    }
}
