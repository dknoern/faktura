import { NextRequest, NextResponse } from 'next/server';
import { fetchInvoiceById, fetchDefaultTenant } from "@/lib/data";
import { generateEmailHtml } from "@/lib/invoice-renderer";
import { getImageHost } from "@/lib/utils/imageHost";
import { generateAutoPrintScript } from "@/lib/utils/printing";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const invoiceId = parseInt(resolvedParams.id);
  
  if (isNaN(invoiceId)) {
    return new NextResponse('Invoice not found', { status: 404 });
  }

  try {
    const imageHost = await getImageHost();
    const [invoice, tenant] = await Promise.all([
      fetchInvoiceById(invoiceId),
      fetchDefaultTenant()
    ]);

    if (!invoice) {
      return new NextResponse('Invoice not found', { status: 404 });
    }

    const emailHtml = generateEmailHtml(invoice, tenant, imageHost);

    const html = `
<!DOCTYPE html>
<html>
  <head>
    <title>Invoice #${invoice._id}</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
      }

      @media print {
        body {
          margin: 0 !important;
          padding: 0 !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        @page {
          margin: 0.5in;
          size: auto;
        }
      }

      @media screen {
        body {
          padding: 20px;
        }
      }
    </style>
    <script>
      ${generateAutoPrintScript()}
    </script>
  </head>
  <body>
    ${emailHtml}
  </body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
