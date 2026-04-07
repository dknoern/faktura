import { NextRequest, NextResponse } from 'next/server';
import { fetchRepairById, fetchDefaultTenant } from '@/lib/data';
import { getImageHost } from '@/lib/utils/imageHost';
import { getRepairImages } from '@/lib/utils/storage';
import { generateRepairPdfBuffer } from '@/lib/pdf/generate-repair-pdf';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const repairId = resolvedParams.id;

  try {
    const imageHost = await getImageHost();

    const [repair, tenant, images] = await Promise.all([
      fetchRepairById(repairId),
      fetchDefaultTenant(),
      getRepairImages(repairId),
    ]);

    if (!repair) {
      return NextResponse.json({ error: 'Repair not found' }, { status: 404 });
    }

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Serialize the MongoDB document to handle Date objects and ObjectIds
    const serializedRepair = JSON.parse(JSON.stringify(repair));

    const logoUrl = `${imageHost}/api/images/logo-${tenant._id}.png`;

    // Build full image URLs for the PDF renderer
    const imageUrls = images.map(image => {
      return image.startsWith('/')
        ? `${imageHost}/api/images${image}`
        : `${imageHost}/api/images/${image}`;
    });

    const pdfBuffer = await generateRepairPdfBuffer(serializedRepair, tenant, logoUrl, imageUrls);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Repair-${serializedRepair.repairNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating repair PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
