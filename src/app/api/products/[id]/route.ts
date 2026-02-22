import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Product from '@/lib/db/models/Product';
import fs from 'fs';
import path from 'path';

// Fallback: Read products from JSON file if DB fails
function getProductsFromJSON(): any[] {
    try {
        const productsPath = path.join(process.cwd(), 'products.json');
        const data = fs.readFileSync(productsPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading products.json:', error);
        return [];
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Try to get from MongoDB first
        try {
            await connectDB();
            const product = await Product.findById(id);

            if (product) {
                // Check if product has valid price
                if (product.price > 0) {
                    return NextResponse.json(product);
                }
            }
        } catch (dbError) {
            console.log('MongoDB error, falling back to JSON:', dbError);
        }

        // Fallback to JSON file
        const products = getProductsFromJSON();
        const product = products.find(p => p._id === id || p.sku === id);

        if (!product) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(product);
    } catch (error: unknown) {
        console.error('Error fetching product:', error);
        return NextResponse.json(
            { error: 'Failed to fetch product' },
            { status: 500 }
        );
    }
}
