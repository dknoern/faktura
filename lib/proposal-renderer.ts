import { Tenant } from "./invoice-renderer";


interface ProposalLineItem {
  name: string;
  longDesc: string;
  amount: number;
}

export interface Proposal {
  _id: string;
  customerId: string;
  customerFirstName: string;
  customerLastName: string;
  date: string;
  total: number;
  lineItems: ProposalLineItem[];
  status?: string;
}


export function generateProposalHtml(proposal: Proposal, tenant: Tenant, imageBaseUrl?: string): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    // Get timezone from environment variable, default to Central timezone
    const timeZone = process.env.TIMEZONE || 'America/Chicago';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      timeZone,
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const logoUrl = imageBaseUrl ? `${imageBaseUrl}/api/images/logo-${tenant._id}.png` : '';
  const companyName = tenant.nameLong || 'Company';
  const footerParts = [companyName, tenant.address, `${[tenant.city, tenant.state, tenant.zip].filter(Boolean).join(' ')}`, tenant.phone].filter(Boolean);

  return `
    <div style="max-width: 780px; margin: 0 auto; padding: 40px 40px 20px 40px; font-family: Arial, sans-serif;">
      <!-- Header -->
      <div style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 24px;">
        ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="max-height: 80px; width: auto;">` : ''}
        <div>
          <h1 style="color: #B69D57; font-size: 32px; margin: 0; font-weight: bold; font-family: Arial, sans-serif;">${companyName}</h1>
          <p style="margin: 0; font-size: 18px; color: #555; font-weight: bold;">Proposal</p>
        </div>
      </div>

      <!-- Date Badge -->
      <div style="margin-bottom: 20px;">
        <span style="background-color: #ffffff; padding: 0px 0x; font-size: 13px; font-weight: bold; display: inline-block;">${formatDate(proposal.date)}</span>
      </div>

      <!-- Client Info & Project -->
      <div style="display: flex; justify-content: flex-start; gap: 200px; margin-bottom: 24px;">
        <div>
          <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 14px;">Client Information</p>
          <p style="margin: 0; font-size: 14px;">${proposal.customerFirstName} ${proposal.customerLastName}</p>
        </div>
        ${proposal.status ? `
        <div>
          <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 14px;">Status</p>
          <p style="margin: 0; font-size: 14px;">${proposal.status}</p>
        </div>
        ` : ''}
      </div>

      <!-- Line Items Table -->
      <div style="margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #dddddd;">
              <th style="border: 1px solid #aaa; padding: 8px 12px; text-align: left; font-weight: bold; color: #000; font-size: 13px;">Item</th>
              <th style="border: 1px solid #aaa; padding: 8px 12px; text-align: right; font-weight: bold; color: #000; font-size: 13px; width: 100px;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${proposal.lineItems.map(item => `
              <tr>
                <td style="border: 1px solid #ccc; padding: 10px 12px; vertical-align: top; font-size: 13px;">
                  ${item.longDesc ? `${item.longDesc}` : `${item.name}`}
                </td>
                <td style="border: 1px solid #ccc; padding: 10px 12px; text-align: right; vertical-align: top; font-size: 13px;">${formatCurrency(item.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Terms -->
      <div style="margin-bottom: 30px; font-size: 13px; line-height: 1.6;">
        <p style="margin: 0 0 14px 0;">${tenant.proposalTerms || ''}</p>
      </div>

      <!-- Signature Block -->
      <div style="margin-bottom: 40px; font-size: 13px;">
        <p style="margin: 0 0 20px 0; font-weight: bold;">The Contract, as stated above, is accepted by the owner (or realtor):</p>
        <p style="margin: 0 0 16px 0;">Owners or Realtor&rsquo;s Signature: ________________________________________</p>
        <p style="margin: 0 0 16px 0;">Mailing Address: ___________________________________________________</p>
        <p style="margin: 0 0 16px 0;">Telephone Number: _________________________________________________</p>
      </div>

      <!-- Footer -->
      <div style="margin-top: 60px; padding-top: 12px; border-top: 1px solid #ccc; text-align: center; color: #666; font-size: 11px;">
        <p style="margin: 0;">${footerParts.join(' &ndash; ')}</p>
      </div>
    </div>
  `;
}

export function generateEmailHtml(proposal: Proposal, tenant: Tenant, imageBaseUrl?: string): string {
  const proposalHtml = generateProposalHtml(proposal, tenant, imageBaseUrl);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Proposal</title>
      <style>
        @media print {
          body { margin: 0.5in; }
          @page { margin: 0.5in; }
        }
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.4; 
          color: #333; 
          margin: 0; 
          padding: 20px; 
        }
      </style>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        }
      </script>
    </head>
    <body>
      ${proposalHtml}
    </body>
    </html>
  `;
}
