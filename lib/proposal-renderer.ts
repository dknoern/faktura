import { Tenant } from "./invoice-renderer";


interface ProposalLineItem {
  name: string;
  longDesc: string;
  amount: number;
}

export interface Proposal {
  _id: number;
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
      month: 'numeric',
      day: 'numeric'
    });
  };

  const logoUrl = imageBaseUrl ? `${imageBaseUrl}/api/images/logo-${tenant._id}.png` : '';

  return `
    <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #B69D57; padding-bottom: 20px;">
        <div style="flex: 1;">
          ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="height: 76px; width: 190px; margin-bottom: 10px;">` : ''}
          <h1 style="color: #B69D57; font-size: 24px; margin: 0; font-weight: bold;">PROPOSAL</h1>
        </div>
        <div style="text-align: right; flex: 1;">
          ${tenant.address ? `<p style="margin: 2px 0; color: #666;">${tenant.address}</p>` : ''}
          ${tenant.city || tenant.state || tenant.zip ? `<p style="margin: 2px 0; color: #666;">${[tenant.city, tenant.state, tenant.zip].filter(Boolean).join(', ')}</p>` : ''}
          ${tenant.phone ? `<p style="margin: 2px 0; color: #666;">Phone: ${tenant.phone}</p>` : ''}
          ${tenant.email ? `<p style="margin: 2px 0; color: #666;">Email: ${tenant.email}</p>` : ''}
        </div>
      </div>

      <!-- Proposal Info -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div>
          <h3 style="margin: 0 0 10px 0; color: #333;">Proposal Details</h3>
          <p style="margin: 5px 0;"><strong>Proposal #:</strong> ${proposal._id}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${formatDate(proposal.date)}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> ${proposal.status || 'Draft'}</p>
        </div>
        <div>
          <h3 style="margin: 0 0 10px 0; color: #333;">Customer</h3>
          <p style="margin: 5px 0;"><strong>${proposal.customerFirstName} ${proposal.customerLastName}</strong></p>
        </div>
      </div>

      <!-- Line Items -->
      <div style="margin-bottom: 30px;">
        <h3 style="margin: 0 0 15px 0; color: #333;">Line Items</h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">Name</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">Description</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right; font-weight: bold; width: 120px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${proposal.lineItems.map(item => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 12px; vertical-align: top; font-weight: 500;">${item.name}</td>
                <td style="border: 1px solid #ddd; padding: 12px; vertical-align: top; white-space: pre-wrap;">${item.longDesc}</td>
                <td style="border: 1px solid #ddd; padding: 12px; text-align: right; vertical-align: top; font-weight: 500;">${formatCurrency(item.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background-color: #f9f9f9;">
              <td colspan="2" style="border: 1px solid #ddd; padding: 12px; text-align: right; font-weight: bold;">Total:</td>
              <td style="border: 1px solid #ddd; padding: 12px; text-align: right; font-weight: bold; font-size: 16px;">${formatCurrency(proposal.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Footer -->
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px;">
        <p>This proposal is valid for 30 days from the date above.</p>
        <p>Thank you for your business!</p>
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
      <title>Proposal #${proposal._id}</title>
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
