import { NextRequest, NextResponse } from 'next/server';
import { fetchLogItemById, fetchDefaultTenant } from "@/lib/data";
import { generateEmailHtml } from "@/lib/log-renderer";
import { getImageHost } from "@/lib/utils/imageHost";
import { generateAutoPrintScript } from "@/lib/utils/printing";
import { getLogImages } from "@/lib/utils/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const logId = resolvedParams.id;
  
  if (!logId) {
    return new NextResponse('Log not found', { status: 404 });
  }

  try {
    const imageHost = await getImageHost();
    const [logitem, tenant, images] = await Promise.all([
      fetchLogItemById(logId),
      fetchDefaultTenant(),
      getLogImages(logId)
    ]);

    if (!logitem) {
      return new NextResponse('Log not found', { status: 404 });
    }

    // Serialize the MongoDB document to handle Date objects and ObjectIds
    const log = JSON.parse(JSON.stringify(logitem));
    const emailHtml = generateEmailHtml(log, tenant, imageHost, images);

    const html = `
<!DOCTYPE html>
<html>
  <head>
    <title>Log Entry - ${new Date(log.date).toLocaleDateString()}</title>
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
    console.error('Error fetching log:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
