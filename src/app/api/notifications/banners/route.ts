import { NextRequest, NextResponse } from 'next/server';
import { BannerModel } from '@/lib/database/schemas/notifications';

// Simple auth middleware replacement
async function getAuthFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return { authorized: false, user: null };
  }
  // For now, just check if header exists
  return { authorized: true, user: { _id: 'system' } };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);

    const { position, targetUser } = Object.fromEntries(request.nextUrl.searchParams);

    const query: any = { isActive: true };

    if (position) {
      query.position = position;
    }

    if (targetUser) {
      query.$or = [
        { targetAudience: 'all' },
        { targetAudience: targetUser },
      ];
    }

    const now = new Date();
    const banners = await BannerModel.find(query)
      .where('startDate').lte(now)
      .where('endDate').gte(now)
      .sort({ displayOrder: 1, createdAt: -1 });

    return NextResponse.json(banners);
  } catch (error) {
    console.error('Error retrieving banners:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);

    const bannerData = await request.json();

    if (!bannerData.title || !bannerData.content || !bannerData.startDate || !bannerData.endDate) {
      return NextResponse.json({ error: 'Title, content, start date, and end date are required' }, { status: 400 });
    }

    const banner = new BannerModel({
      ...bannerData,
      createdBy: auth.user?._id || 'system',
    });

    await banner.save();

    return NextResponse.json({ success: true, banner });
  } catch (error) {
    console.error('Error creating banner:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);

    const id = request.nextUrl.searchParams.get('id');
    const bannerData = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Banner ID is required' }, { status: 400 });
    }

    const banner = await BannerModel.findByIdAndUpdate(
      id,
      { ...bannerData, updatedAt: new Date() },
      { new: true }
    );

    if (!banner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, banner });
  } catch (error) {
    console.error('Error updating banner:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);

    const id = request.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Banner ID is required' }, { status: 400 });
    }

    await BannerModel.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
