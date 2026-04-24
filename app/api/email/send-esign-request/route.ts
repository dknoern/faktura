import { NextResponse } from 'next/server';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { fetchRepairById, fetchProposalById, fetchOutById, fetchTenant } from '@/lib/data';
import { getImageHost } from '@/lib/utils/imageHost';
import { Repair } from '@/lib/models/repair';
import { Proposal } from '@/lib/models/proposal';
import { Out } from '@/lib/models/out';
import dbConnect from '@/lib/dbConnect';
import { randomUUID } from 'crypto';

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

function formatCurrency(value: number = 0): string {
  return `$${value.toFixed(2)}`;
}

function generateEsignEmailHtml(
  type: 'repair' | 'proposal' | 'out',
  data: any,
  tenant: any,
  esignUrl: string,
  imageBaseUrl: string
): string {
  const logoUrl = `${imageBaseUrl}/api/images/logo-${tenant._id}.png`;

  let documentTitle = '';
  let documentDetails = '';
  let customerName = '';

  if (type === 'repair') {
    documentTitle = 'Repair Proposal';
    customerName = `${data.customerFirstName} ${data.customerLastName}`.trim();
    documentDetails = `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 150px;">Repair #</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.repairNumber || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Date</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${formatDate(data.dateOut)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Item</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.description || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Vendor</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.vendor || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Repair Issues</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.repairIssues || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Estimated Cost</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.repairCost ? formatCurrency(data.repairCost) : 'N/A'}</td>
        </tr>
      </table>
    `;
  } else if (type === 'proposal') {
    documentTitle = 'Proposal';
    customerName = `${data.customerFirstName} ${data.customerLastName}`.trim();
    const lineItemsHtml = data.lineItems && data.lineItems.length > 0
      ? data.lineItems.map((item: any) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">
            <div style="font-weight: bold; text-transform: uppercase;">${item.name || 'N/A'}</div>
            ${item.longDesc ? `<div style="font-size: 12px; color: #666; margin-top: 2px;">${item.longDesc}</div>` : ''}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.amount)}</td>
        </tr>
      `).join('')
      : '<tr><td colspan="2" style="padding: 8px; text-align: center; color: #999;">No items</td></tr>';

    documentDetails = `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 150px;">Date</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${formatDate(data.date)}</td>
        </tr>
      </table>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
            <th style="padding: 8px; text-align: right; border-bottom: 2px solid #ddd; width: 100px;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${lineItemsHtml}
        </tbody>
        <tfoot>
          <tr style="border-top: 2px solid #333;">
            <td style="padding: 8px; font-weight: bold;">Total</td>
            <td style="padding: 8px; text-align: right; font-weight: bold;">${formatCurrency(data.total)}</td>
          </tr>
        </tfoot>
      </table>
    `;
  } else if (type === 'out') {
    documentTitle = 'Log Out Item';
    customerName = data.sentTo || 'Customer';
    documentDetails = `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 150px;">Date</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${formatDate(data.date)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Sent To</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.sentTo || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Description</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.description || 'N/A'}</td>
        </tr>
        ${data.comments ? `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Comments</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.comments}</td>
        </tr>` : ''}
      </table>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div style="margin-bottom: 20px;">
          <img src="${logoUrl}" height="76px" width="190px" alt="${tenant.nameLong || 'Company'}" />
        </div>

        <h2 style="color: #B69D57; margin-bottom: 5px;">${documentTitle} - Signature Required</h2>

        <p>Dear ${customerName},</p>

        <p>Please review the following ${documentTitle.toLowerCase()} details and sign electronically to confirm your approval.</p>

        ${documentDetails}

        <div style="text-align: center; margin: 30px 0;">
          <a href="${esignUrl}" 
             style="display: inline-block; background-color: #B69D57; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: bold;">
            Review &amp; Sign Document
          </a>
        </div>

        <p style="color: #666; font-size: 12px;">
          If the button above doesn't work, copy and paste this link into your browser:<br/>
          <a href="${esignUrl}" style="color: #B69D57;">${esignUrl}</a>
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />

        <div style="font-size: 11px; color: #999;">
          <p>${tenant.nameLong || tenant.name || ''}</p>
          <p>${tenant.address || ''}, ${tenant.city || ''}, ${tenant.state || ''} ${tenant.zip || ''}</p>
          <p>${tenant.phone ? `Phone: ${tenant.phone}` : ''}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function POST(request: Request) {
  try {
    const { type, id, email } = await request.json();

    if (!type || !id || !email) {
      return NextResponse.json(
        { error: 'Type, ID, and email are required' },
        { status: 400 }
      );
    }

    // Parse comma-delimited email addresses
    const emailAddresses = email
      .split(',')
      .map((addr: string) => addr.trim())
      .filter((addr: string) => addr.length > 0);

    if (emailAddresses.length === 0) {
      return NextResponse.json(
        { error: 'At least one valid email address is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Generate a unique esign token
    const esignToken = randomUUID();

    // Store the token on the document
    let data: any;
    let documentTitle = '';

    if (type === 'repair') {
      await Repair.findByIdAndUpdate(id, { esignToken });
      data = await fetchRepairById(id);
      documentTitle = `Repair #${data?.repairNumber}`;
    } else if (type === 'proposal') {
      await Proposal.findByIdAndUpdate(id, { esignToken });
      data = await fetchProposalById(id);
      documentTitle = `Proposal for ${data?.customerFirstName} ${data?.customerLastName}`.trim();
    } else if (type === 'out') {
      await Out.findByIdAndUpdate(id, { esignToken });
      data = await fetchOutById(id);
      documentTitle = `Log Out - ${data?.sentTo}`;
    } else {
      return NextResponse.json(
        { error: 'Invalid document type' },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    const tenant = await fetchTenant();
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant information not found' },
        { status: 404 }
      );
    }

    const imageHost = await getImageHost();

    // Build the esign URL
    const baseUrl = imageHost || process.env.NEXTAUTH_URL || process.env.AUTH_URL || 'http://localhost:3000';
    const esignUrl = `${baseUrl}/esign/${esignToken}`;

    const emailHtml = generateEsignEmailHtml(type, data, tenant, esignUrl, imageHost);

    const params = {
      Source: tenant.email,
      Destination: {
        ToAddresses: emailAddresses,
      },
      Message: {
        Subject: {
          Data: `${documentTitle} - Signature Required from ${tenant.nameLong || tenant.name || ''}`,
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
      message: `E-sign request sent to ${emailAddresses.length} recipient${emailAddresses.length > 1 ? 's' : ''}`,
    });
  } catch (error) {
    console.error('Error sending esign request email:', error);
    return NextResponse.json(
      { error: 'Failed to send esign request email' },
      { status: 500 }
    );
  }
}
