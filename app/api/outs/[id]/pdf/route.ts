import { NextRequest, NextResponse } from 'next/server';
import { fetchOutById, fetchDefaultTenant } from '@/lib/data';
import { getImageHost } from '@/lib/utils/imageHost';
import { getOutImages } from '@/lib/utils/storage';
import { generateOutPdfBuffer } from '@/lib/pdf/generate-out-pdf';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const outId = resolvedParams.id;

  try {
    const imageHost = await getImageHost();

    const [outitem, tenant, images] = await Promise.all([
      fetchOutById(outId),
      fetchDefaultTenant(),
      getOutImages(outId),
    ]);

    if (!outitem) {
      return NextResponse.json({ error: 'Out entry not found' }, { status: 404 });
    }

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Serialize the MongoDB document to handle Date objects and ObjectIds
    const out = JSON.parse(JSON.stringify(outitem));

    const logoUrl = `${imageHost}/api/images/logo-${tenant._id}.png`;

    // Build full image URLs for the PDF renderer
    const imageUrls = images.map(image => {
      return image.startsWith('/')
        ? `${imageHost}/api/images${image}`
        : `${imageHost}/api/images/${image}`;
    });

    const pdfBuffer = await generateOutPdfBuffer(out, tenant, logoUrl, imageUrls);

    const dateStr = new Date(out.date).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    }).replace(/\//g, '-');

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="LogOut-${dateStr}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating out PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
