import { NextResponse } from 'next/server';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { fetchRepairByNumber, fetchDefaultTenant } from '@/lib/data';
import { Repair, Tenant, generateEmailHtml } from '@/lib/repair-renderer';

// Initialize AWS SES client
const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-west-2', // hard-coded for now until we verify in correct region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',

  },
});

export async function POST(request: Request) {
  try {
    const { repairNumber, email } = await request.json();
    
    if (!repairNumber || !email) {
      return NextResponse.json(
        { error: 'Repair number and email are required' },
        { status: 400 }
      );
    }
    
    // Fetch repair and tenant data
    const repair = await fetchRepairByNumber(repairNumber);
    const tenant = await fetchDefaultTenant();
    
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
    
    // Generate email HTML content using the shared utility
    const emailHtml = generateEmailHtml(repair as Repair, tenant as Tenant);
    
    // Send email using AWS SES
    const params = {
      Source: tenant.email,
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Data: `Repair #${repair.repairNumber} from ${tenant.nameLong || 'DeMesy'}`,
        },
        Body: {
          Html: {
            Data: emailHtml,
          },
        },
      },
    };
    
    await sesClient.send(new SendEmailCommand(params));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending repair email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
