import { NextResponse } from 'next/server';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { fetchRepairByNumber, fetchDefaultTenant } from '@/lib/data';

// Initialize AWS SES client
const sesClient = new SESClient({
  region: 'us-west-2', // hard-coded for now until we verify in correct region
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
    
    // Format repair date
    const formattedDate = repair.dateOut
      ? new Date(repair.dateOut).toLocaleDateString()
      : new Date().toLocaleDateString();
    
    // Format repair cost
    const formattedCost = (repair.repairCost || 0).toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    });
    
    // Create email HTML content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { margin-bottom: 20px; }
          .logo { max-width: 200px; }
          .section { margin-bottom: 20px; }
          .section-title { font-weight: bold; font-size: 18px; margin-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #eee; }
          th { font-weight: bold; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              <h2>${tenant.nameLong}</h2>
              <p>${tenant.address}</p>
              <p>${tenant.city}, ${tenant.state} ${tenant.zip}</p>
              <p>Phone: ${tenant.phone}</p>
              <p>Fax: ${tenant.fax || 'N/A'}</p>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Repair #</div>
            <p>${repair.repairNumber}</p>
          </div>
          
          <div class="section">
            <div class="section-title">Repair Date</div>
            <p>${formattedDate}</p>
          </div>
          
          <div class="section">
            <div class="section-title">Customer Name</div>
            <p>${repair.customerFirstName} ${repair.customerLastName}</p>
          </div>
          
          <div class="section">
            <div class="section-title">Vendor Name</div>
            <p>${repair.vendor || 'N/A'}</p>
          </div>
          
          <div class="section">
            <div class="section-title">Item Details</div>
            <table>
              <thead>
                <tr>
                  <th>ITEM #</th>
                  <th>DESCRIPTION</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${repair.itemNumber || 'N/A'}</td>
                  <td>${repair.description || 'N/A'}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="section">
            <div class="section-title">Repair Issues</div>
            <p>${repair.repairIssues || 'None specified'}</p>
          </div>
          
          <div class="section">
            <div class="section-title">Repair Cost</div>
            <p>${formattedCost}</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
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
