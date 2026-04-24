import { NextResponse } from 'next/server';
import { SESClient, SendRawEmailCommand } from '@aws-sdk/client-ses';
import { fetchRepairById, fetchTenant } from '@/lib/data';
import { getImageHost } from '@/lib/utils/imageHost';
import { getRepairImages } from '@/lib/utils/storage';
import { generateRepairPdfBase64 } from '@/lib/pdf/generate-repair-pdf';

// Initialize AWS SES client
const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

function buildRawEmail(
  from: string,
  to: string[],
  subject: string,
  htmlBody: string,
  pdfBase64: string,
  pdfFilename: string
): string {
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const rawEmail = [
    `From: ${from}`,
    `To: ${to.join(', ')}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    htmlBody,
    '',
    `--${boundary}`,
    `Content-Type: application/pdf; name="${pdfFilename}"`,
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="${pdfFilename}"`,
    '',
    pdfBase64,
    '',
    `--${boundary}--`,
  ].join('\r\n');

  return rawEmail;
}

export async function POST(request: Request) {
  try {
    const { repairId, email } = await request.json();
    
    if (!repairId || !email) {
      return NextResponse.json(
        { error: 'Repair ID and email are required' },
        { status: 400 }
      );
    }
    
    // Parse comma-delimited email addresses
    const emailAddresses = email.split(',').map((addr: string) => addr.trim()).filter((addr: string) => addr.length > 0);
    
    // Fetch repair and tenant data
    const repair = await fetchRepairById(repairId);
    const tenant = await fetchTenant();
    
    if (!repair) {
      return NextResponse.json(
        { error: 'Repair not found' },
        { status: 404 }
      );
    }
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant information not found' },
        { status: 404 }
      );
    }
    
    // Get image host for logo URLs and repair images
    const [imageHost, images] = await Promise.all([
      getImageHost(),
      getRepairImages(repairId)
    ]);

    const serializedRepair = JSON.parse(JSON.stringify(repair));
    const companyName = tenant.nameLong || 'DeMesy';
    const customerName = `${serializedRepair.customerFirstName} ${serializedRepair.customerLastName}`.trim();
    const subject = `Repair #${serializedRepair.repairNumber} from ${companyName}`;
    const emailHtml = `<p>${customerName}:</p><p>Your repair order #${serializedRepair.repairNumber} from ${companyName} is attached.</p><p>Thank you.</p>`;

    // Generate PDF server-side
    const logoUrl = `${imageHost}/api/images/logo-${tenant._id}.png`;
    const imageUrls = images.map(image => {
      return image.startsWith('/')
        ? `${imageHost}/api/images${image}`
        : `${imageHost}/api/images/${image}`;
    });

    const pdfBase64 = await generateRepairPdfBase64(serializedRepair, tenant, logoUrl, imageUrls, false);
    const pdfFilename = `Repair-${serializedRepair.repairNumber}.pdf`;

    const rawEmail = buildRawEmail(
      tenant.email,
      emailAddresses,
      subject,
      emailHtml,
      pdfBase64,
      pdfFilename
    );

    await sesClient.send(new SendRawEmailCommand({
      RawMessage: {
        Data: new TextEncoder().encode(rawEmail),
      },
    }));
    
    return NextResponse.json({ 
      success: true, 
      message: `Email sent to ${emailAddresses.length} recipient${emailAddresses.length > 1 ? 's' : ''}` 
    });
  } catch (error) {
    console.error('Error sending repair email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
