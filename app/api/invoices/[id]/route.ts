import { NextResponse } from 'next/server';
import { fetchInvoiceById, fetchTenant } from '@/lib/data';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {

  const id = (await params).id;

  try {

    if (!id) {
      return NextResponse.json(
        { error: 'Invalid invoice ID' },
        { status: 400 }
      );
    }
    
    const invoice = await fetchInvoiceById(id);
    const tenant = await fetchTenant();
    
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      invoice,
      tenant
    });
  } catch (error) {
    console.error('Error fetching invoice data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice data' },
      { status: 500 }
    );
  }
}
