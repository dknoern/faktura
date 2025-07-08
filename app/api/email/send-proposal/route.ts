import { NextRequest, NextResponse } from 'next/server';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { fetchProposalById, fetchDefaultTenant } from '@/lib/data';
import { generateProposalHtml } from '@/lib/proposal-renderer';
import { getImageHost } from '@/lib/utils/imageHost';

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

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

    const tenant = await fetchDefaultTenant();
    const imageHost = await getImageHost();

    // Parse email addresses
    const emailAddresses = emails.split(',').map((email: string) => email.trim()).filter((email: string) => email);
    
    if (emailAddresses.length === 0) {
      return NextResponse.json({ error: 'No valid email addresses provided' }, { status: 400 });
    }

    // Generate HTML content
    const htmlContent = generateProposalHtml(proposal, tenant, imageHost);

    // Prepare email
    const params = {
      Source: process.env.FROM_EMAIL!,
      Destination: {
        ToAddresses: emailAddresses,
      },
      Message: {
        Subject: {
          Data: `Proposal #${proposal._id} from ${tenant.companyName}`,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlContent,
            Charset: 'UTF-8',
          },
          Text: {
            Data: `Please find attached Proposal #${proposal._id} from ${tenant.companyName}. Total: $${proposal.total.toFixed(2)}`,
            Charset: 'UTF-8',
          },
        },
      },
    };

    // Send email
    const command = new SendEmailCommand(params);
    await sesClient.send(command);

    return NextResponse.json({ 
      message: `Proposal sent successfully to ${emailAddresses.length} recipient${emailAddresses.length > 1 ? 's' : ''}` 
    });

  } catch (error) {
    console.error('Error sending proposal email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
