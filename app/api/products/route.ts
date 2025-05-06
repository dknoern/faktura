import { NextRequest, NextResponse } from 'next/server';
import { fetchProducts } from '@/lib/data';
import dbConnect from '@/lib/dbConnect';
import { productModel } from '@/lib/models/product';
import mongoose from 'mongoose';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const data = await fetchProducts(page, limit, search);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get auth session
    const session = await auth();
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Extract tenant from Auth0 token
    // The tenant value can be extracted from various places depending on Auth0 setup
    // It could be in session.user.email, a custom claim, or another property
    const tenantId = session.user.email?.split('@')[1] || 'default'; // Using domain as tenant for demonstration
    
    await dbConnect();
    const data = await request.json();
    
    // Add tenant to product data
    data.tenant = tenantId;
    
    // Set creation date
    data.lastUpdated = new Date();
    
    // Generate search field for easier searching
    data.search = [
      data.itemNumber,
      data.title,
      data.manufacturer,
      data.model,
      data.serialNo
    ].filter(Boolean).join(' ').toLowerCase();
    
    // Create a temporary ObjectId and use it for the id field
    const tempId = new mongoose.Types.ObjectId();
    data.id = tempId.toString();
    
    // Create the new product
    const newProduct = await productModel.create(data);
    
    return NextResponse.json({
      _id: newProduct._id,
      ...newProduct.toObject()
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
