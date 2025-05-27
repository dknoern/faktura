import { NextRequest, NextResponse } from 'next/server';
import { fetchInvoicesByCustomerId } from '@/lib/customerData';

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

    const data = await fetchInvoicesByCustomerId(customerId, page, 10000);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching customer invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}
