import { NextRequest, NextResponse } from 'next/server';
import { fetchLogItemById, fetchTenant } from "@/lib/data";
import { getImageHost } from "@/lib/utils/imageHost";
import { getLogImages } from "@/lib/utils/storage";
import { generateLogPdfBuffer } from "@/lib/pdf/generate-log-pdf";

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
      fetchTenant(),
      getLogImages(logId)
    ]);

    if (!logitem) {
      return new NextResponse('Log not found', { status: 404 });
    }

    if (!tenant) {
      return new NextResponse('Tenant not found', { status: 404 });
    }

    // Serialize the MongoDB document to handle Date objects and ObjectIds
    const log = JSON.parse(JSON.stringify(logitem));

    const logoUrl = `${imageHost}/api/images/logo-${tenant._id}.png`;

    // Build full image URLs for the PDF renderer
    const imageUrls = images.map(image => {
      return image.startsWith('/')
        ? `${imageHost}/api/images${image}`
        : `${imageHost}/api/images/${image}`;
    });

    const pdfBuffer = await generateLogPdfBuffer(log, tenant, logoUrl, imageUrls);

    const dateStr = new Date(log.date).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    }).replace(/\//g, '-');

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Log-${dateStr}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating log PDF:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
