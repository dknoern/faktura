import { NextRequest, NextResponse } from 'next/server';
import { fetchRepairs } from '@/lib/data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const { repairs, pagination } = await fetchRepairs(page, limit, search, 'outstanding');
    
    return NextResponse.json({
      data: repairs,
      totalItems: pagination.total,
      totalPages: pagination.pages,
      currentPage: pagination.currentPage,
      limit: pagination.limit
    });
  } catch (error) {
    console.error('Error fetching repairs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repairs' },
      { status: 500 }
    );
  }
}