import { NextRequest, NextResponse } from 'next/server';
import { fetchInvoiceById, fetchDefaultTenant } from '@/lib/data';
import { generateInvoiceHtml } from '@/lib/invoice-renderer';
import { getImageHost } from '@/lib/utils/imageHost';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const invoiceId = resolvedParams.id;

  try {
    const imageHost = await getImageHost();
    const [invoice, tenant] = await Promise.all([
      fetchInvoiceById(invoiceId),
      fetchDefaultTenant()
    ]);

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const invoiceHtml = generateInvoiceHtml(invoice, tenant, imageHost);

    return NextResponse.json({
      html: invoiceHtml,
      invoiceNumber: invoice.invoiceNumber,
    });
  } catch (error) {
    console.error('Error generating invoice PDF data:', error);
    return NextResponse.json({ error: 'Failed to generate PDF data' }, { status: 500 });
  }
}
