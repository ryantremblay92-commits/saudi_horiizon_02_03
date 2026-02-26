import { NextRequest, NextResponse } from 'next/server';
import { StockAlertModel } from '@/lib/database/schemas/notifications';

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
    
    const { productId, email } = await request.json();
    
    if (!productId || !email) {
      return NextResponse.json({ error: 'Product ID and email are required' }, { status: 400 });
    }

    const existingAlert = await StockAlertModel.findOne({
      productId,
      userId: auth.user?._id || 'anonymous',
    });

    if (existingAlert) {
      return NextResponse.json({ error: 'Alert already exists for this product' }, { status: 400 });
    }

    const stockAlert = new StockAlertModel({
      productId,
      userId: auth.user?._id || 'anonymous',
      email,
      createdAt: new Date(),
    });

    await stockAlert.save();

    return NextResponse.json({ success: true, stockAlert });
  } catch (error) {
    console.error('Error creating stock alert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    
    const id = request.nextUrl.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 });
    }

    await StockAlertModel.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting stock alert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    
    const stockAlerts = await StockAlertModel.find({ 
      userId: auth.user?._id || 'anonymous' 
    }).sort({ createdAt: -1 });

    return NextResponse.json(stockAlerts);
  } catch (error) {
    console.error('Error retrieving stock alerts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
