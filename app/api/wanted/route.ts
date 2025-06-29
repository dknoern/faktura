import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Wanted } from '@/lib/models/wanted';
import { getShortUserFromToken } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const currentUser = await getShortUserFromToken();
    
    const wanted = new Wanted({
      ...body,
      createdDate: new Date(),
      createdBy: currentUser,
    });
    
    await wanted.save();
    
    return NextResponse.json(wanted, { status: 201 });
  } catch (error) {
    console.error('Error creating wanted item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    
    const skip = (page - 1) * limit;
    let query: any = {};
    
    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { customerName: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const wanted = await Wanted.find(query)
      .sort({ createdDate: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Wanted.countDocuments(query);
    
    return NextResponse.json({
      wanted,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching wanted items:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
