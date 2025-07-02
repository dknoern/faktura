import { NextResponse } from 'next/server';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
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
    const invoice = await fetchInvoiceById(Number(invoiceId));
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
    
    // Send email using AWS SES
    const params = {
      Source: tenant.email,
      Destination: {
        ToAddresses: emailAddresses,
      },
      Message: {
        Subject: {
          Data: `Invoice #${invoice._id} from ${tenant.nameLong || 'DeMesy'}`,
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
    console.error('Error sending invoice email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
