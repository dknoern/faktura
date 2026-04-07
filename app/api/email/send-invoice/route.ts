import { NextResponse } from 'next/server';
import { SESClient, SendRawEmailCommand } from '@aws-sdk/client-ses';
import { fetchInvoiceById, fetchTenantById } from '@/lib/data';
import { getTenantId } from '@/lib/auth-utils';
import { getImageHost } from '@/lib/utils/imageHost';
import { generateInvoicePdfBase64 } from '@/lib/pdf/generate-invoice-pdf';

// Initialize AWS SES client
const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-west-2',
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
    const { invoiceId, email } = await request.json();
    
    if (!invoiceId || !email) {
      return NextResponse.json(
        { error: 'Invoice ID and email are required' },
        { status: 400 }
      );
    }
    
    // Parse comma-delimited email addresses
    const emailAddresses = email.split(',').map((addr: string) => addr.trim()).filter((addr: string) => addr.length > 0);
    
    // Fetch invoice and tenant data
    const invoice = await fetchInvoiceById(invoiceId);
    const tenantId = await getTenantId();
    const tenant = await fetchTenantById(tenantId);
    
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant information not found' },
        { status: 404 }
      );
    }
    
    const companyName = tenant.nameLong || 'DeMesy';
    const customerName = `${invoice.customerFirstName} ${invoice.customerLastName}`.trim();
    const subject = `Invoice #${invoice.invoiceNumber} from ${companyName}`;
    const emailHtml = `<p>${customerName}:</p><p>Your invoice number ${invoice.invoiceNumber} from ${companyName} is attached.</p><p>Thank you.</p>`;

    // Generate PDF server-side
    const imageHost = await getImageHost();
    const logoUrl = `${imageHost}/api/images/logo-${tenant._id}.png`;
    const pdfBase64 = await generateInvoicePdfBase64(invoice, tenant, logoUrl);
    const pdfFilename = `Invoice-${invoice.invoiceNumber}.pdf`;

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
    console.error('Error sending invoice email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
