import { NextResponse } from 'next/server';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { fetchDefaultTenant } from '@/lib/data';

// Initialize AWS SES client
const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

interface KioskRepairEmailData {
  repairNumber: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
}

export async function POST(request: Request) {
  try {
    const { repairNumber, customerFirstName, customerLastName, customerEmail }: KioskRepairEmailData = await request.json();
    
    if (!repairNumber || !customerFirstName || !customerLastName || !customerEmail) {
      return NextResponse.json(
        { error: 'All repair and customer details are required' },
        { status: 400 }
      );
    }
    
    // Fetch tenant data for company info
    const tenant = await fetchDefaultTenant();
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant information not found' },
        { status: 404 }
      );
    }
    
    // Email subject
    const subject = `${tenant.nameLong || ''} Repair #${repairNumber}: ${customerFirstName} ${customerLastName}`;
    
    // Email body
    const emailBody = `Hi ${customerFirstName},

${tenant.repairConfirmationText || 'Thank you for entrusting your timepiece to us. We are pleased to confirm that we have received your watch for a repair estimate.\n\nOur team of watchmakers will carefully evaluate your watch and prepare a detailed estimate.\nIf you have any questions or require further assistance, you may simply reply to this email or contact us.\n\nBest regards,\nThe Team'}`;
    
    // Send email using AWS SES
    const params = {
      Source: tenant.nameLong ? `${tenant.nameLong} <${tenant.repairEmail || "repairs@somewhere.com"}>` : (tenant.repairEmail || "repairs@somewhere.com"),
      Destination: {
        ToAddresses: [customerEmail],
      },
      Message: {
        Subject: {
          Data: subject,
        },
        Body: {
          Text: {
            Data: emailBody,
          },
        },
      },
    };
    
    await sesClient.send(new SendEmailCommand(params));
    
    return NextResponse.json({ 
      success: true, 
      message: `Repair confirmation email sent to ${customerEmail}` 
    });
  } catch (error) {
    console.error('Error sending kiosk repair email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
