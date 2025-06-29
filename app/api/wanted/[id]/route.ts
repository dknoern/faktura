import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Wanted } from '@/lib/models/wanted';
import { getShortUserFromToken } from '@/lib/auth-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const wanted = await Wanted.findById(id);
    
    if (!wanted) {
      return NextResponse.json({ error: 'Wanted item not found' }, { status: 404 });
    }
    
    return NextResponse.json(wanted);
  } catch (error) {
    console.error('Error fetching wanted item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const currentUser = await getShortUserFromToken();
    
    // If foundDate is being set and wasn't set before, add foundBy
    const existingWanted = await Wanted.findById(id);
    if (body.foundDate && !existingWanted?.foundDate) {
      body.foundBy = currentUser;
    }
    
    const wanted = await Wanted.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );
    
    if (!wanted) {
      return NextResponse.json({ error: 'Wanted item not found' }, { status: 404 });
    }
    
    return NextResponse.json(wanted);
  } catch (error) {
    console.error('Error updating wanted item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const wanted = await Wanted.findByIdAndDelete(id);
    
    if (!wanted) {
      return NextResponse.json({ error: 'Wanted item not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Wanted item deleted successfully' });
  } catch (error) {
    console.error('Error deleting wanted item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
