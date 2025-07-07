import { notFound } from "next/navigation";
import { fetchLogItemById, fetchDefaultTenant } from "@/lib/data";
import { generateEmailHtml } from "@/lib/log-renderer";
import { getImageHost } from "@/lib/utils/imageHost";

interface PrintLogPageProps {
  params: Promise<{ id: string }>;
}

export default async function PrintLogPage({ params }: PrintLogPageProps) {
  const resolvedParams = await params;
  const logId = resolvedParams.id;
  const imageHost = await getImageHost();

  const [logitem, tenant] = await Promise.all([
    fetchLogItemById(logId),
    fetchDefaultTenant()
  ]);

  if (!logitem) {
    notFound();
  }

  // Serialize the MongoDB document to handle Date objects and ObjectIds
  const log = JSON.parse(JSON.stringify(logitem));

  const emailHtml = generateEmailHtml(log, tenant, imageHost);

  return (
    <html>
      <head>
        <title>Log Entry - {new Date(log.date).toLocaleDateString()}</title>
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
