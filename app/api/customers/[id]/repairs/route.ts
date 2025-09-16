import { NextRequest, NextResponse } from 'next/server';
import { fetchRepairsByCustomerId } from '@/lib/customerData';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params before using its properties
    const { id } = await params;
    const customerId = parseInt(id);
    
    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: 'Invalid customer ID' },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    //const limit = parseInt(searchParams.get('limit') || '10');
    const limit = 10000;

    const data = await fetchRepairsByCustomerId(customerId, page, limit);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching customer repairs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repairs' },
      { status: 500 }
    );
  }
}
