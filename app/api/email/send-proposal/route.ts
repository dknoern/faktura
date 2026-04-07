import { NextRequest, NextResponse } from 'next/server';
import { SESClient, SendRawEmailCommand } from '@aws-sdk/client-ses';
import { fetchProposalById, fetchTenantById } from '@/lib/data';
import { getTenantId } from '@/lib/auth-utils';
import { getImageHost } from '@/lib/utils/imageHost';
import { generateProposalPdfBase64 } from '@/lib/pdf/generate-proposal-pdf';

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
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

export async function POST(request: NextRequest) {
  try {
    const { proposalId, emails } = await request.json();

    if (!proposalId || !emails) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch proposal and tenant data
    const proposal = await fetchProposalById(proposalId);
    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    const tenantId = await getTenantId();
    const tenant = await fetchTenantById(tenantId);

    // Parse email addresses
    const emailAddresses = emails.split(',').map((email: string) => email.trim()).filter((email: string) => email);
    
    if (emailAddresses.length === 0) {
      return NextResponse.json({ error: 'No valid email addresses provided' }, { status: 400 });
    }

    const companyName = tenant.nameLong || 'Company';
    const customerName = `${proposal.customerFirstName} ${proposal.customerLastName}`.trim();
    const subject = `Proposal from ${companyName}`;
    const emailHtml = `<p>${customerName}:</p><p>Your proposal from ${companyName} is attached.</p><p>Thank you.</p>`;

    // Generate PDF server-side
    const imageHost = await getImageHost();
    const logoUrl = `${imageHost}/api/images/logo-${tenant._id}.png`;
    const pdfBase64 = await generateProposalPdfBase64(proposal, tenant, logoUrl);
    const pdfFilename = `Proposal-${proposal.customerLastName}.pdf`;

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
      message: `Proposal sent successfully to ${emailAddresses.length} recipient${emailAddresses.length > 1 ? 's' : ''}` 
    });

  } catch (error) {
    console.error('Error sending proposal email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
