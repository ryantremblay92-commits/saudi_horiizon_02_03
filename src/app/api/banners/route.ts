import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Banner from '@/lib/db/models/Banner';

// GET /api/banners?position=hero  — public, no auth required
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const position = searchParams.get('position');

        const query: Record<string, unknown> = { isActive: true };
        if (position) query.position = position;

        const banners = await Banner.find(query).sort({ createdAt: -1 });

        return NextResponse.json({ banners });
    } catch (error) {
        console.error('Error fetching public banners:', error);
        return NextResponse.json({ banners: [] });
    }
}
