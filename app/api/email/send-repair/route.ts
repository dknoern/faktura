import { NextResponse } from 'next/server';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { fetchRepairById, fetchDefaultTenant } from '@/lib/data';
import { Repair, Tenant, generateEmailHtml } from '@/lib/repair-renderer';
import { getImageHost } from '@/lib/utils/imageHost';

// Initialize AWS SES client
const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',

  },
});

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
    
    // Get image host for logo URLs
    const imageHost = await getImageHost();
    
    // Generate email HTML content using the shared utility
    const emailHtml = generateEmailHtml(repair as Repair, tenant as Tenant, imageHost);
    
    // Send email using AWS SES
    const params = {
      Source: tenant.email,
      Destination: {
        ToAddresses: emailAddresses,
      },
      Message: {
        Subject: {
          Data: `Repair #${repair._id} from ${tenant.nameLong || 'DeMesy'}`,
        },
        Body: {
          Html: {
            Data: emailHtml,
          },
        },
      },
    };
    
    await sesClient.send(new SendEmailCommand(params));
    
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
