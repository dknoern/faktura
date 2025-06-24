import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Out } from '@/lib/models/out';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const id = (await params).id;
    const _id = new mongoose.Types.ObjectId(id);
    
    const out = await Out.findOne({ _id });
    
    if (!out) {
      return NextResponse.json(
        { error: 'Out item not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(out);
  } catch (error) {
    console.error('Error fetching out:', error);
    return NextResponse.json(
      { error: 'Failed to fetch out item' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const id = (await params).id;
    const _id = new mongoose.Types.ObjectId(id);
    const data = await request.json();
    
    // Generate search field for easier searching
    data.search = [
      data.sentTo,
      data.description,
      data.comments,
      data.user
    ].filter(Boolean).join(' ').toLowerCase();
    
    const updatedOut = await Out.findOneAndUpdate(
      { _id },
      data,
      { new: true, runValidators: true }
    );
    
    if (!updatedOut) {
      return NextResponse.json(
        { error: 'Out item not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedOut);
  } catch (error) {
    console.error('Error updating out:', error);
    return NextResponse.json(
      { error: 'Failed to update out item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const id = (await params).id;
    const _id = new mongoose.Types.ObjectId(id);
    
    const deletedOut = await Out.findOneAndDelete({ _id });
    
    if (!deletedOut) {
      return NextResponse.json(
        { error: 'Out item not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Out item deleted successfully' });
  } catch (error) {
    console.error('Error deleting out:', error);
    return NextResponse.json(
      { error: 'Failed to delete out item' },
      { status: 500 }
    );
  }
}
