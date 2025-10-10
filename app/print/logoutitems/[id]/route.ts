import { NextRequest, NextResponse } from 'next/server';
import { fetchOutById, fetchDefaultTenant } from "@/lib/data";
import { generateEmailHtml } from "@/lib/out-renderer";
import { getImageHost } from "@/lib/utils/imageHost";
import { generateAutoPrintScript } from "@/lib/utils/printing";
import { getOutImages } from "@/lib/utils/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const outId = resolvedParams.id;
  
  if (!outId) {
    return new NextResponse('Out not found', { status: 404 });
  }

  try {
    const imageHost = await getImageHost();
    const [outitem, tenant, images] = await Promise.all([
      fetchOutById(outId),
      fetchDefaultTenant(),
      getOutImages(outId)
    ]);

    if (!outitem) {
      return new NextResponse('Out not found', { status: 404 });
    }

    // Serialize the MongoDB document to handle Date objects and ObjectIds
    const out = JSON.parse(JSON.stringify(outitem));
    const emailHtml = generateEmailHtml(out, tenant, imageHost, images);

    const html = `
<!DOCTYPE html>
<html>
  <head>
    <title>Log Out Entry - ${new Date(out.date).toLocaleDateString()}</title>
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
    console.error('Error fetching out:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
