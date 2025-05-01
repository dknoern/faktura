import { NextRequest, NextResponse } from 'next/server';
import { fetchOutstandingRepairs } from '@/lib/data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const data = await fetchOutstandingRepairs(page, limit, search);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching repairs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repairs' },
      { status: 500 }
    );
  }
}