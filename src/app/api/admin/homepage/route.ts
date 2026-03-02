import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import HomepageConfig from '@/lib/db/models/HomepageConfig';
import { verifyAuth } from '@/lib/auth/middleware';

// GET - Fetch homepage config (public for frontend, full for admin)
export async function GET(request: NextRequest) {
    try {
        await connectDB();
        const config = await (HomepageConfig as any).getConfig();
        return NextResponse.json(config);
    } catch (error) {
        console.error('Error fetching homepage config:', error);
        return NextResponse.json(
            { message: 'Failed to fetch homepage config' },
            { status: 500 }
        );
    }
}

// PUT - Update homepage config (admin only)
export async function PUT(request: NextRequest) {
    try {
        const user = await verifyAuth(request);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const body = await request.json();

        let config = await (HomepageConfig as any).getConfig();

        // Update fields that are provided
        if (body.featuredProductIds !== undefined) {
            config.featuredProductIds = body.featuredProductIds;
        }
        if (body.featuredProductsCount !== undefined) {
            config.featuredProductsCount = body.featuredProductsCount;
        }
        if (body.sections !== undefined) {
            config.sections = body.sections;
        }
        if (body.stats !== undefined) {
            config.stats = { ...config.stats, ...body.stats };
        }
        if (body.testimonials !== undefined) {
            config.testimonials = body.testimonials;
        }
        if (body.heroTitle !== undefined) {
            config.heroTitle = body.heroTitle;
        }
        if (body.heroSubtitle !== undefined) {
            config.heroSubtitle = body.heroSubtitle;
        }

        config.updatedBy = user.sub;
        await config.save();

        return NextResponse.json(config);
    } catch (error) {
        console.error('Error updating homepage config:', error);
        return NextResponse.json(
            { message: 'Failed to update homepage config' },
            { status: 500 }
        );
    }
}
