import { NextRequest, NextResponse } from 'next/server';
import { RecentlyViewedProductModel } from '@/lib/database/schemas/notifications';

// Simple auth middleware replacement
async function getAuthFromRequest(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
        return { authorized: false, user: null };
    }
    return { authorized: true, user: { _id: 'system' } };
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    
    const { productId, productName, productImage } = await request.json();
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const recentlyViewed = new RecentlyViewedProductModel({
      userId: auth.user?._id || 'anonymous',
      productId,
      productName,
      productImage,
      viewedAt: new Date(),
    });

    await recentlyViewed.save();

    return NextResponse.json({ success: true, recentlyViewed });
  } catch (error) {
    console.error('Error adding recently viewed product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    
    const recentlyViewed = await RecentlyViewedProductModel.find({ 
      userId: auth.user?._id || 'anonymous' 
    })
      .sort({ viewedAt: -1 })
      .limit(10);

    return NextResponse.json(recentlyViewed);
  } catch (error) {
    console.error('Error retrieving recently viewed products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
