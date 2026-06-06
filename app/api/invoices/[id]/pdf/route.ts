import { NextRequest, NextResponse } from 'next/server';
import { fetchInvoiceById, fetchTenantById } from '@/lib/data';
import { getTenantId } from '@/lib/auth-utils';
import { getLogoDataUrl } from '@/lib/utils/logo';
import { generateInvoicePdfBuffer } from '@/lib/pdf/generate-invoice-pdf';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const invoiceId = resolvedParams.id;

  try {
    const tenantId = await getTenantId();

    const [invoice, tenant] = await Promise.all([
      fetchInvoiceById(invoiceId),
      fetchTenantById(tenantId),
    ]);

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const logoUrl = await getLogoDataUrl(tenant._id.toString());
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
