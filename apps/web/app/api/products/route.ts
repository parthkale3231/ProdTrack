import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import Product from '../../../lib/models/Product';

export async function GET() {
  try {
    await dbConnect();
    const products = await (Product as any).find({}).sort({ createdAt: -1 });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Check if product already exists
    const existing = await (Product as any).findOne({ itemNo: new RegExp(`^${body.itemNo}$`, 'i') });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Product with this Item No already exists' }, { status: 400 });
    }

    const product = await (Product as any).create(body);
    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
