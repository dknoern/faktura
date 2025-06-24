import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Out } from '@/lib/models/out';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    
    const skip = (page - 1) * limit;
    
    let query = {};
    if (search) {
      query = {
        $or: [
          { sentTo: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { comments: { $regex: search, $options: 'i' } },
          { user: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const outs = await Out.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalCount = await Out.countDocuments(query);
    
    return NextResponse.json({
      outs: outs,
      pagination: {
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching outs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch outs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const data = await request.json();
    
    // Set the date to current date if not provided
    if (!data.date) {
      data.date = new Date();
    }
    
    // Generate search field for easier searching
    data.search = [
      data.sentTo,
      data.description,
      data.comments,
      data.user
    ].filter(Boolean).join(' ').toLowerCase();
    
    const newOut = new Out(data);
    const savedOut = await newOut.save();
    
    return NextResponse.json(savedOut, { status: 201 });
  } catch (error) {
    console.error('Error creating out:', error);
    return NextResponse.json(
      { error: 'Failed to create out' },
      { status: 500 }
    );
  }
}
