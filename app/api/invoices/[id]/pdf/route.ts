import { NextRequest, NextResponse } from 'next/server';
import { fetchInvoiceById, fetchDefaultTenant } from '@/lib/data';
import { getImageHost } from '@/lib/utils/imageHost';
import { generateInvoicePdfBuffer } from '@/lib/pdf/generate-invoice-pdf';

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

    const logoUrl = `${imageHost}/api/images/logo-${tenant._id}.png`;
    const pdfBuffer = await generateInvoicePdfBuffer(invoice, tenant, logoUrl);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Invoice-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
