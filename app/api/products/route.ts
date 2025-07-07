import { NextRequest, NextResponse } from 'next/server';
import { fetchProducts } from '@/lib/data';
import dbConnect from '@/lib/dbConnect';
import { productModel } from '@/lib/models/product';
import mongoose from 'mongoose';
import { getShortUserFromToken} from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'lastUpdated';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const data = await fetchProducts(page, limit, search, sortBy, sortOrder);
    
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
    await dbConnect();
    const data = await request.json();
    
    // Check if a product with the same itemNumber already exists
    if (data.itemNumber) {
      const existingProduct = await productModel.findOne({ itemNumber: data.itemNumber });
      if (existingProduct) {
        return NextResponse.json(
          { error: `A product with item number '${data.itemNumber}' already exists` },
          { status: 400 }
        );
      }
    }
    
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

    // Get user from JWT claim (email)
    const username = await getShortUserFromToken();
    data.history = [];

    const date = new Date();
    
    data.history.push({
      user: username,
      date: date,
      search: [
        date.toISOString().split('T')[0],
        username
      ].filter(Boolean).join(' ').toLowerCase(),
      action: "entered",
    });
    
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
