// Repair renderer utility
// Generates plain HTML for repair content that can be used in both email and web views

export interface Repair {
  _id: string;
  repairNumber: string;
  itemNumber: string;
  description: string;
  dateOut: string | null;
  customerApprovedDate: string | null;
  returnDate: string | null;
  customerFirstName: string;
  customerLastName: string;
  vendor: string;
  repairCost: number;
  repairIssues: string;
  repairNotes: string;
}

export interface Tenant {
  _id?: string | number;
  nameLong?: string;
  email?: string;
  phone?: string;
  fax?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  website?: string;
}

// Format currency values
export const formatCurrency = (value: number = 0) => {
  return value.toLocaleString('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 2
  });
};

// Format date values
export const formatDate = (dateString: string | null) => {
  return dateString 
    ? new Date(dateString).toLocaleDateString() 
    : '';
};

// Generate repair HTML content
export const generateRepairHtml = (repair: Repair, tenant: Tenant, imageBaseUrl: string, showCustomerName: boolean = true): string => {
  const formattedDate = formatDate(repair.dateOut);
  const formattedReturnDate = formatDate(repair.returnDate);
  const formattedCustomerApprovedDate = formatDate(repair.customerApprovedDate);
  const formattedCost = formatCurrency(repair.repairCost);
  
  const logoUrl = `${imageBaseUrl}/api/images/logo-${tenant._id}.png`;
  
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; font-size: 12px">
      <!-- Header with Logo and Company Info -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <div>
          <img src="${logoUrl}" height="76px" width="190px" alt="Company Logo" />
          <div style="color: #B69D57; font-size: 24px; margin-top: 10px;">REPAIR ORDER</div>
        </div>
        <div style="text-align: left;">
          <p style="margin: 1px 0;">${tenant.address || ''}</p>
          <p style="margin: 1px 0;">${tenant.city || ''}, ${tenant.state || ''} ${tenant.zip || ''}</p>
          <p style="margin: 1px 0;">Phone ${tenant.phone || ''}</p>
          ${tenant.fax ? `<p style="margin: 1px 0;">Fax ${tenant.fax}</p>` : ''}
        </div>
      </div>
      
      <!-- Repair Information -->
      <div style="margin-bottom: 20px; margin-top: 15px;">
        <div style="margin-bottom: 15px;">
          <h3 style="font-weight: bold;">Repair #</h3>
          <p>${repair.repairNumber}</p>
        </div>

        <div style="margin-bottom: 15px;">
          <h3 style="font-weight: bold;">Repair Date</h3>
          <p>${formattedDate}</p>
        </div>

        ${repair.customerApprovedDate ? `<div style="margin-bottom: 15px;">
          <h3 style="font-weight: bold;">Customer Approved Date</h3>
          <p>${formattedCustomerApprovedDate}</p>
        </div>` : ''}

        ${repair.returnDate ? `<div style="margin-bottom: 15px;">
          <h3 style="font-weight: bold;">Return Date</h3>
          <p>${formattedReturnDate}</p>
        </div>` : ''}

        ${showCustomerName ? `<div style="margin-bottom: 15px;">
          <h3 style="font-weight: bold;">Customer Name</h3>
          <p style="margin: 5px 0;">${repair.customerFirstName} ${repair.customerLastName}</p>
        </div>` : ''}

        <div style="margin-bottom: 15px;">
          <h3 style="font-weight: bold; margin-bottom: 5px;">Vendor Name</h3>
          <p style="margin: 5px 0;">${repair.vendor || 'N/A'}</p>
        </div>
      </div>
      
      <!-- Item Table -->
      <div style="margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid #eee;">
              <th style="text-align: left; padding: 8px; font-weight: bold;">ITEM #</th>
              <th style="text-align: left; padding: 8px; font-weight: bold;">DESCRIPTION</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${repair.itemNumber || 'N/A'}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${repair.description || 'N/A'}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Repair Issues -->
      <div style="margin-bottom: 20px;">
        <h3 style="font-weight: bold; margin-bottom: 5px;">Repair Issues</h3>
        <p style="margin: 5px 0;">${repair.repairIssues || 'None specified'}</p>
      </div>
      
      <!-- Repair Cost -->
      <div style="margin-bottom: 20px;">
        <h3 style="font-weight: bold; margin-bottom: 5px;">Repair Cost</h3>
        <p style="margin: 5px 0;">${formattedCost}</p>
      </div>
      <div style="margin-bottom: 20px;">
      ${repair.repairNotes || 'None specified'}
    </div>
  `;
};

// Generate complete email HTML with proper doctype and head
export const generateEmailHtml = (repair: Repair, tenant: Tenant, imageBaseUrl: string, showCustomerName: boolean = false): string => {
  const repairHtml = generateRepairHtml(repair, tenant, imageBaseUrl, showCustomerName);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .section { margin-bottom: 20px; }
        .section-title { font-weight: bold; font-size: 18px; margin-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #eee; }
        th { font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        ${repairHtml}
      </div>
    </body>
    </html>
  `;
};
