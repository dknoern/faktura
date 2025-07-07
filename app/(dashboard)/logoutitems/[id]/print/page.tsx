import { notFound } from "next/navigation";
import { fetchOutById, fetchDefaultTenant } from "@/lib/data";
import { generateEmailHtml } from "@/lib/out-renderer";
import { getImageHost } from "@/lib/utils/imageHost";

interface PrintOutPageProps {
  params: Promise<{ id: string }>;
}

export default async function PrintOutPage({ params }: PrintOutPageProps) {
  const resolvedParams = await params;
  const outId = resolvedParams.id;
  const imageHost = await getImageHost();

  const [outitem, tenant] = await Promise.all([
    fetchOutById(outId),
    fetchDefaultTenant()
  ]);

  if (!outitem) {
    notFound();
  }

  // Serialize the MongoDB document to handle Date objects and ObjectIds
  const out = JSON.parse(JSON.stringify(outitem));

  const emailHtml = generateEmailHtml(out, tenant, imageHost);

  return (
    <html>
      <head>
        <title>Log Out Entry - {new Date(out.date).toLocaleDateString()}</title>
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
              margin: 0.5in;
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
