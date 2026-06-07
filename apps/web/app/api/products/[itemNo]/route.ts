import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Product from '../../../../lib/models/Product';

export async function PUT(request: Request, { params }: { params: Promise<{ itemNo: string }> }) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // params.itemNo must be awaited in Next.js 15+
    const { itemNo } = await params;

    const product = await (Product as any).findOneAndUpdate(
      { itemNo: new RegExp(`^${itemNo}$`, 'i') },
      body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ itemNo: string }> }) {
  try {
    await dbConnect();
    const { itemNo } = await params;

    const product = await (Product as any).findOneAndUpdate(
      { itemNo: new RegExp(`^${itemNo}$`, 'i') },
      { isArchived: true },
      { new: true }
    );

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
