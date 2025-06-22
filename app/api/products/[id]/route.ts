import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { productModel } from '@/lib/models/product';
import mongoose from 'mongoose';




export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: number }> }
) {

  try {
    await dbConnect();
    const id = (await params).id;
    const _id = new mongoose.Types.ObjectId(id);
    
    const product = await productModel.findOne({ _id });
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: number }> }
) {
  try {
    await dbConnect();
    const id = (await params).id;
    const _id = new mongoose.Types.ObjectId(id);
    const data = await request.json();
    
    // Update the lastUpdated timestamp
    data.lastUpdated = new Date();
    
    // Generate search field for easier searching
    data.search = [
      data.itemNumber,
      data.title,
      data.manufacturer,
      data.model,
      data.serialNo
    ].filter(Boolean).join(' ').toLowerCase();
    
    // Make sure the id field matches the MongoDB _id
    data.id = id;
    
    const updatedProduct = await productModel.findOneAndUpdate(
      { _id },
      data,
      { new: true, runValidators: true }
    );
    
    if (!updatedProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: number }> }
) {
  try {
    await dbConnect();
    const id = (await params).id;
    const _id = new mongoose.Types.ObjectId(id);
    
    // Instead of deleting, update the status to "Deleted"
    const updatedProduct = await productModel.findOneAndUpdate(
      { _id },
      { 
        status: 'Deleted',
        lastUpdated: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Product marked as deleted successfully', product: updatedProduct });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
