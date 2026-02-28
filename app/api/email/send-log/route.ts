import { NextResponse } from 'next/server';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { fetchLogItemById, fetchDefaultTenant } from '@/lib/data';
import { getImageHost } from '@/lib/utils/imageHost';
import { getLogImages } from '@/lib/utils/storage';

// Initialize AWS SES client
const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

interface LineItem {
  itemNumber?: string;
  name?: string;
  repairNumber?: string;
  repairCost?: number;
}

function formatDate(dateString: string | Date | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const timeZone = process.env.TIMEZONE || 'America/Chicago';
  return date.toLocaleDateString('en-US', {
    timeZone,
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}

function formatDateTime(dateString: string | Date | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const timeZone = process.env.TIMEZONE || 'America/Chicago';
  const datePart = date.toLocaleDateString('en-US', {
    timeZone,
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${datePart} ${timePart}`;
}

function formatCurrency(value: number = 0): string {
  return `$${value.toFixed(2)}`;
}

function generateLogEmailHtml(
  log: any,
  tenant: any,
  imageBaseUrl: string,
  images: string[] = []
): string {
  const logoUrl = `${imageBaseUrl}/api/images/logo-${tenant._id}.png`;
  const formattedDateTime = formatDateTime(log.date);

  const lineItemsHtml = log.lineItems && log.lineItems.length > 0
    ? log.lineItems.map((item: LineItem) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name || '-'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.itemNumber || '-'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.repairNumber || '-'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.repairCost ? formatCurrency(item.repairCost) : '-'}</td>
        </tr>
      `).join('')
    : `<tr><td colspan="4" style="padding: 8px; text-align: center; color: #6c757d;">No items logged</td></tr>`;

  const imagesHtml = images && images.length > 0
    ? `
      <div style="margin-bottom: 20px;">
        <h3 style="font-weight: bold; margin-bottom: 10px;">Images</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
          ${images.map(image => {
            const imageUrl = image.startsWith('/') ? `${imageBaseUrl}/api/images${image}` : `${imageBaseUrl}/api/images/${image}`;
            return `
              <div style="border: 1px solid #ddd; border-radius: 4px; padding: 10px; background-color: #f9f9f9;">
                <img src="${imageUrl}" alt="Log Item Image" style="width: 100%; height: 150px; object-fit: contain; border-radius: 4px;" />
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #eee; }
        th { font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; font-size: 12px">
          <!-- Header with Logo and Company Info -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div>
              <img src="${logoUrl}" height="76px" width="190px" alt="Company Logo" />
              <div style="color: #B69D57; font-size: 24px; margin-top: 10px;">LOG ENTRY</div>
            </div>
            <div style="text-align: left;">
              <p style="margin: 1px 0;">${tenant.address || ''}</p>
              <p style="margin: 1px 0;">${tenant.city || ''}, ${tenant.state || ''} ${tenant.zip || ''}</p>
              <p style="margin: 1px 0;">Phone ${tenant.phone || ''}</p>
              ${tenant.fax ? `<p style="margin: 1px 0;">Fax ${tenant.fax}</p>` : ''}
            </div>
          </div>

          <!-- Log Information -->
          <div style="margin-bottom: 20px; margin-top: 15px;">
            <div style="margin-bottom: 15px;">
              <h3 style="font-weight: bold;">Date & Time</h3>
              <p>${formattedDateTime}</p>
            </div>

            <div style="margin-bottom: 15px;">
              <h3 style="font-weight: bold;">Received From</h3>
              <p>${log.receivedFrom || 'N/A'}</p>
            </div>

            ${log.user ? `<div style="margin-bottom: 15px;">
              <h3 style="font-weight: bold;">Received By</h3>
              <p>${log.user}</p>
            </div>` : ''}

            ${log.customerName ? `<div style="margin-bottom: 15px;">
              <h3 style="font-weight: bold;">Customer Name</h3>
              <p>${log.customerName}</p>
            </div>` : ''}

            ${log.vendor ? `<div style="margin-bottom: 15px;">
              <h3 style="font-weight: bold;">Vendor</h3>
              <p>${log.vendor}</p>
            </div>` : ''}
          </div>

          <!-- Comments -->
          ${log.comments ? `
          <div style="margin-bottom: 20px;">
            <h3 style="font-weight: bold; margin-bottom: 5px;">Comments</h3>
            <p style="margin: 5px 0; white-space: pre-wrap;">${log.comments}</p>
          </div>
          ` : ''}

          <!-- Line Items Table -->
          <div style="margin-bottom: 20px;">
            <h3 style="font-weight: bold; margin-bottom: 10px;">Items Logged</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 1px solid #eee;">
                  <th style="text-align: left; padding: 8px; font-weight: bold;">Description</th>
                  <th style="text-align: left; padding: 8px; font-weight: bold;">Item #</th>
                  <th style="text-align: left; padding: 8px; font-weight: bold;">Repair #</th>
                  <th style="text-align: right; padding: 8px; font-weight: bold;">Cost</th>
                </tr>
              </thead>
              <tbody>
                ${lineItemsHtml}
              </tbody>
            </table>
          </div>

          <!-- Signature -->
          ${log.signature ? `
          <div style="margin-bottom: 20px;">
            <h3 style="font-weight: bold; margin-bottom: 5px;">Customer Signature</h3>
            ${log.signatureDate ? `<p style="margin: 5px 0; color: #6c757d; font-size: 11px;">Signed on ${formatDate(log.signatureDate)}</p>` : ''}
            <div style="border: 1px solid #ddd; border-radius: 4px; padding: 10px; background-color: #f9f9f9; display: inline-block;">
              <img src="${log.signature}" alt="Customer Signature" style="max-width: 300px; height: auto;" />
            </div>
          </div>
          ` : ''}

          <!-- Images -->
          ${imagesHtml}
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function POST(request: Request) {
  try {
    const { logId, email } = await request.json();

    if (!logId || !email) {
      return NextResponse.json(
        { error: 'Log ID and email are required' },
        { status: 400 }
      );
    }

    // Parse comma-delimited email addresses
    const emailAddresses = email.split(',').map((addr: string) => addr.trim()).filter((addr: string) => addr.length > 0);

    // Fetch log and tenant data
    const log = await fetchLogItemById(logId);
    const tenant = await fetchDefaultTenant();

    if (!log) {
      return NextResponse.json(
        { error: 'Log entry not found' },
        { status: 404 }
      );
    }

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant information not found' },
        { status: 404 }
      );
    }

    // Get image host for logo URLs and log images
    const [imageHost, images] = await Promise.all([
      getImageHost(),
      getLogImages(logId)
    ]);

    // Generate email HTML content
    const emailHtml = generateLogEmailHtml(log, tenant, imageHost, images);

    const formattedDate = formatDate(log.date);

    // Send email using AWS SES
    const params = {
      Source: tenant.email,
      Destination: {
        ToAddresses: emailAddresses,
      },
      Message: {
        Subject: {
          Data: `Log Entry ${formattedDate} - ${log.receivedFrom || 'Unknown'} from ${tenant.nameLong || 'DeMesy'}`,
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
      message: `Email sent to ${emailAddresses.length} recipient${emailAddresses.length > 1 ? 's' : ''}`,
    });
  } catch (error) {
    console.error('Error sending log email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
