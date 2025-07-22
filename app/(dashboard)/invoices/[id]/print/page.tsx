import { notFound } from "next/navigation";
import { fetchInvoiceById, fetchDefaultTenant } from "@/lib/data";
import { generateEmailHtml } from "@/lib/invoice-renderer";

interface PrintInvoicePageProps {
  params: Promise<{ id: string }>;
}

export default async function PrintInvoicePage({ params }: PrintInvoicePageProps) {
  const resolvedParams = await params;
  const invoiceId = parseInt(resolvedParams.id);
  
  if (isNaN(invoiceId)) {
    notFound();
  }

  const [invoice, tenant] = await Promise.all([
    fetchInvoiceById(invoiceId),
    fetchDefaultTenant()
  ]);

  if (!invoice) {
    notFound();
  }

  const imageBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  const emailHtml = generateEmailHtml(invoice, tenant, imageBaseUrl);

  return (
    <html>
      <head>
        <title>Invoice #{invoice._id}</title>
        <style>{`
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
              margin: 0.25in;
              size: auto;
            }
          }
          
          @media screen {
            body {
              padding: 20px;
            }
          }
        `}</style>

      </head>
      <body dangerouslySetInnerHTML={{ __html: emailHtml }} />
    </html>
  );
}
