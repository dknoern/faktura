import { notFound } from "next/navigation";
import { fetchRepairById, fetchDefaultTenant } from "@/lib/data";
import { generateEmailHtml } from "@/lib/repair-renderer";
import { getImageHost } from "@/lib/utils/imageHost";

interface PrintRepairPageProps {
  params: Promise<{ id: string }>;
}

export default async function PrintRepairPage({ params }: PrintRepairPageProps) {
  const resolvedParams = await params;
  const repairId = resolvedParams.id;
  const imageHost = await getImageHost();

  const [repair, tenant] = await Promise.all([
    fetchRepairById(repairId),
    fetchDefaultTenant()
  ]);

  if (!repair) {
    notFound();
  }

  const emailHtml = generateEmailHtml(repair, tenant, imageHost);

  return (
    <html>
      <head>
        <title>Repair #{repair.repairNumber}</title>
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
