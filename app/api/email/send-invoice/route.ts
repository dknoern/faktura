import { NextResponse } from 'next/server';
import { SESClient, SendEmailCommand, SendRawEmailCommand } from '@aws-sdk/client-ses';
import { fetchInvoiceById, fetchDefaultTenant } from '@/lib/data';
import { generateEmailHtml } from '@/lib/invoice-renderer';
import { getImageHost } from '@/lib/utils/imageHost';

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
    const { invoiceId, email, pdfBase64, invoiceNumber } = await request.json();
    
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
    const tenant = await fetchDefaultTenant();
    const imageHost = await getImageHost();
    
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
    
    // Generate email HTML content using the shared utility
    const emailHtml = generateEmailHtml(invoice, tenant, imageHost);
    const subject = `Invoice #${invoice.invoiceNumber} from ${tenant.nameLong || 'DeMesy'}`;

    if (pdfBase64) {
      // Send with PDF attachment using SendRawEmail
      const pdfFilename = `Invoice-${invoiceNumber || invoice.invoiceNumber}.pdf`;
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
    } else {
      // Fallback: send without attachment
      await sesClient.send(new SendEmailCommand({
        Source: tenant.email,
        Destination: {
          ToAddresses: emailAddresses,
        },
        Message: {
          Subject: { Data: subject },
          Body: {
            Html: { Data: emailHtml },
          },
        },
      }));
    }
    
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
