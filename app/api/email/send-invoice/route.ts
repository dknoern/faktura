import { NextResponse } from 'next/server';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { fetchInvoiceById, fetchDefaultTenant } from '@/lib/data';

interface LineItem {
  itemNumber: string;
  name: string;
  amount: number;
  serialNumber?: string;
  longDesc?: string;
}

// Initialize AWS SES client
const sesClient = new SESClient({
  region: 'us-west-2',
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
    
    // Fetch invoice and tenant data
    const invoice = await fetchInvoiceById(Number(invoiceId));
    const tenant = await fetchDefaultTenant();
    
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
    
    // Format invoice data for email
    const formattedDate = new Date(invoice.date).toLocaleDateString();
    const formattedTotal = (invoice.total || 0).toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    });
    
    // Generate line items HTML
    const lineItemsHtml = invoice.lineItems.map((item: LineItem) => {
      const amount = (item.amount || 0).toLocaleString('en-US', { 
        style: 'currency', 
        currency: 'USD' 
      });
      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${amount}</td>
        </tr>
      `;
    }).join('');
    
    // Create email HTML content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .logo { max-width: 200px; }
          .invoice-title { color: #B69D57; font-size: 24px; margin-top: 10px; }
          .section { margin-bottom: 20px; }
          .section-title { font-weight: bold; margin-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; }
          .total { background-color: #B69D57; color: white; padding: 8px; text-align: right; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              <div class="invoice-title">INVOICE</div>
            </div>
            <div style="text-align: right;">
              <p>Invoice #${invoice._id}</p>
              <p>Date: ${formattedDate}</p>
              <p>Method of Sale: ${invoice.invoiceType}</p>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">BILLING ADDRESS</div>
            <p>${invoice.customerFirstName} ${invoice.customerLastName}</p>
            <p>${invoice.address || ''}</p>
            <p>${invoice.city || ''}, ${invoice.state || ''} ${invoice.zip || ''}</p>
          </div>
          
          <div class="section">
            <div class="section-title">ITEM DESCRIPTION</div>
            <table>
              <thead>
                <tr>
                  <th style="text-align: left; padding: 8px; border-bottom: 2px solid #eee;">Description</th>
                  <th style="text-align: right; padding: 8px; border-bottom: 2px solid #eee;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${lineItemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding-top: 20px;">
                    <table style="width: 100%;">
                      <tr>
                        <td style="text-align: right;">Subtotal:</td>
                        <td style="text-align: right; width: 100px;">${(invoice.subtotal || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                      </tr>
                      <tr>
                        <td style="text-align: right;">Tax:</td>
                        <td style="text-align: right;">${(invoice.tax || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                      </tr>
                      <tr>
                        <td style="text-align: right;">Shipping:</td>
                        <td style="text-align: right;">${(invoice.shipping || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                      </tr>
                      <tr>
                        <td colspan="2" class="total" style="margin-top: 10px;">
                          <strong>TOTAL: ${formattedTotal}</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <div class="section">
            <div class="section-title">Warranty:</div>
            <p>${tenant.warranty || 'N/A'}</p>
          </div>
          
          <div class="section">
            <div class="section-title">Return Privilege:</div>
            <p>${tenant.returnPolicy || 'N/A'}</p>
          </div>
          
          <div class="footer">
            <p>
              <strong>PHONE:</strong> ${tenant.phone || 'N/A'}<br>
              <strong>ADDRESS:</strong> ${tenant.address || ''}, ${tenant.city || ''}, ${tenant.state || ''} ${tenant.zip || ''}<br>
              <strong>WEB:</strong> ${tenant.website || 'N/A'}
            </p>
            
            <p>
              <strong>BANK WIRE TRANSFER INSTRUCTIONS:</strong><br>
              ${tenant.bankWireTransferInstructions || 'N/A'}
            </p>
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
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
