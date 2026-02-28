import { NextResponse } from 'next/server';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { fetchOutById, fetchDefaultTenant } from '@/lib/data';
import { getImageHost } from '@/lib/utils/imageHost';
import { getOutImages } from '@/lib/utils/storage';

// Initialize AWS SES client
const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

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

function generateOutEmailHtml(
  out: any,
  tenant: any,
  imageBaseUrl: string,
  images: string[] = []
): string {
  const logoUrl = `${imageBaseUrl}/api/images/logo-${tenant._id}.png`;
  const formattedDateTime = formatDateTime(out.date);

  const imagesHtml = images && images.length > 0
    ? `
      <div style="margin-bottom: 20px;">
        <h3 style="font-weight: bold; margin-bottom: 10px;">Images</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
          ${images.map(image => {
            const imageUrl = image.startsWith('/') ? `${imageBaseUrl}/api/images${image}` : `${imageBaseUrl}/api/images/${image}`;
            return `
              <div style="border: 1px solid #ddd; border-radius: 4px; padding: 10px; background-color: #f9f9f9;">
                <img src="${imageUrl}" alt="Log Out Item Image" style="width: 100%; height: 150px; object-fit: contain; border-radius: 4px;" />
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
              <div style="color: #B69D57; font-size: 24px; margin-top: 10px;">LOG OUT ENTRY</div>
            </div>
            <div style="text-align: left;">
              <p style="margin: 1px 0;">${tenant.address || ''}</p>
              <p style="margin: 1px 0;">${tenant.city || ''}, ${tenant.state || ''} ${tenant.zip || ''}</p>
              <p style="margin: 1px 0;">Phone ${tenant.phone || ''}</p>
              ${tenant.fax ? `<p style="margin: 1px 0;">Fax ${tenant.fax}</p>` : ''}
            </div>
          </div>

          <!-- Log Out Information -->
          <div style="margin-bottom: 20px; margin-top: 15px;">
            <div style="margin-bottom: 15px;">
              <h3 style="font-weight: bold;">Date & Time</h3>
              <p>${formattedDateTime}</p>
            </div>

            <div style="margin-bottom: 15px;">
              <h3 style="font-weight: bold;">Sent To</h3>
              <p>${out.sentTo || 'N/A'}</p>
            </div>

            <div style="margin-bottom: 15px;">
              <h3 style="font-weight: bold;">Description</h3>
              <p>${out.description || 'N/A'}</p>
            </div>

            ${out.user ? `<div style="margin-bottom: 15px;">
              <h3 style="font-weight: bold;">Logged By</h3>
              <p>${out.user}</p>
            </div>` : ''}
          </div>

          <!-- Comments -->
          ${out.comments ? `
          <div style="margin-bottom: 20px;">
            <h3 style="font-weight: bold; margin-bottom: 5px;">Comments</h3>
            <p style="margin: 5px 0; white-space: pre-wrap;">${out.comments}</p>
          </div>
          ` : ''}

          <!-- Signature -->
          ${out.signature ? `
          <div style="margin-bottom: 20px;">
            <h3 style="font-weight: bold; margin-bottom: 5px;">Customer Signature</h3>
            ${out.signatureDate ? `<p style="margin: 5px 0; color: #6c757d; font-size: 11px;">Signed on ${formatDate(out.signatureDate)}</p>` : ''}
            <div style="border: 1px solid #ddd; border-radius: 4px; padding: 10px; background-color: #f9f9f9; display: inline-block;">
              <img src="${out.signature}" alt="Customer Signature" style="max-width: 300px; height: auto;" />
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
    const { outId, email } = await request.json();

    if (!outId || !email) {
      return NextResponse.json(
        { error: 'Out ID and email are required' },
        { status: 400 }
      );
    }

    // Parse comma-delimited email addresses
    const emailAddresses = email.split(',').map((addr: string) => addr.trim()).filter((addr: string) => addr.length > 0);

    // Fetch out item and tenant data
    const out = await fetchOutById(outId);
    const tenant = await fetchDefaultTenant();

    if (!out) {
      return NextResponse.json(
        { error: 'Log out entry not found' },
        { status: 404 }
      );
    }

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant information not found' },
        { status: 404 }
      );
    }

    // Get image host for logo URLs and out images
    const [imageHost, images] = await Promise.all([
      getImageHost(),
      getOutImages(outId)
    ]);

    // Generate email HTML content
    const emailHtml = generateOutEmailHtml(out, tenant, imageHost, images);

    const formattedDate = formatDate(out.date);

    // Send email using AWS SES
    const params = {
      Source: tenant.email,
      Destination: {
        ToAddresses: emailAddresses,
      },
      Message: {
        Subject: {
          Data: `Log Out ${formattedDate} - ${out.sentTo || 'Unknown'} from ${tenant.nameLong || 'DeMesy'}`,
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
    console.error('Error sending log out email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
