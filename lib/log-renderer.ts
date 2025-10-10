// Log renderer utility functions
import { getDiagnosticFeeText, getRepairDurationText } from "@/lib/utils/ref-data";

export interface LineItem {
  itemNumber?: string;
  name?: string;
  repairNumber?: string;
  repairCost?: number;
  productId?: string;
  repairId?: string;
}

export interface Log {
  id?: string;
  _id?: string;
  date: Date | string;
  receivedFrom: string;
  comments?: string;
  user?: string;
  customerName?: string;
  vendor?: string;
  search?: string;
  lineItems?: LineItem[];
  signature?: string;
  signatureDate?: Date | string;
}

export interface Tenant {
  _id: string;
  name: string;
  nameLong?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  fax?: string;
  email: string;
}

// Helper functions
const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }) + ' ' + new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Generate line items HTML
const generateLineItemsHtml = (lineItems?: LineItem[]): string => {
  if (!lineItems || lineItems.length === 0) {
    return `
      <tr>
        <td colspan="4" style="text-align: center; padding: 20px; color: #666;">
          No items logged
        </td>
      </tr>
    `;
  }

  return lineItems.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">
        ${item.name || '-'}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">
        ${item.itemNumber || '-'}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">
        ${item.repairNumber || '-'}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">
        ${item.repairCost ? formatCurrency(item.repairCost) : '-'}
      </td>
    </tr>
  `).join('');
};

// Generate log HTML content
export const generateLogHtml = (log: Log, tenant: Tenant, imageBaseUrl: string, images: string[] = []): string => {
  const formattedDate = formatDate(log.date);
  const lineItemsHtml = generateLineItemsHtml(log.lineItems);
  
  const logoUrl = `${imageBaseUrl}/api/images/logo-${tenant._id}.png`;
  
  return `
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
          <h3 style="font-weight: bold;">Log Entry Details</h3>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h4 style="font-weight: bold; margin-bottom: 5px;">Date & Time</h4>
          <p style="margin: 5px 0;">${formattedDate}</p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h4 style="font-weight: bold; margin-bottom: 5px;">Received From</h4>
          <p style="margin: 5px 0;">${log.receivedFrom || 'Not specified'}</p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h4 style="font-weight: bold; margin-bottom: 5px;">Received By</h4>
          <p style="margin: 5px 0;">${log.user || 'Not specified'}</p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h4 style="font-weight: bold; margin-bottom: 5px;">Customer Name</h4>
          <p style="margin: 5px 0;">${log.customerName || 'Not specified'}</p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h4 style="font-weight: bold; margin-bottom: 5px;">Vendor</h4>
          <p style="margin: 5px 0;">${log.vendor || 'Not specified'}</p>
        </div>
      </div>
      
      <!-- Comments -->
      ${log.comments ? `
        <div style="margin-bottom: 20px;">
          <h3 style="font-weight: bold; margin-bottom: 5px;">Comments</h3>
          <p style="margin: 5px 0; white-space: pre-wrap;">${log.comments}</p>
        </div>
      ` : ''}
      
      <!-- Terms (for Kiosk users) -->
      ${log.user === "Kiosk" ? `
        <div style="margin-bottom: 20px;">
          <h3 style="font-weight: bold; margin-bottom: 5px;">Terms</h3>
          <p style="margin: 5px 0; white-space: pre-wrap;">${getDiagnosticFeeText()}</p>
          <p style="margin: 5px 0; white-space: pre-wrap;">${getRepairDurationText()}</p>
        </div>
      ` : ''}
      
      <!-- Signature Information -->
      ${log.signature ? `
        <div style="margin-bottom: 20px;">
          <h3 style="font-weight: bold; margin-bottom: 10px;">Signature</h3>
          <div style="border: 1px solid #ddd; border-radius: 4px; padding: 15px; background-color: #f9f9f9;">
            <div style="background-color: white; border: 1px solid #ddd; border-radius: 4px; padding: 8px; display: inline-block;">
              <img src="${log.signature}" alt="Signature" style="height: 64px; object-fit: contain;" />
            </div>
            ${log.signatureDate ? `
              <p style="font-size: 10px; color: #666; margin-top: 8px;">
                Signed on ${new Date(log.signatureDate).toLocaleDateString()}
              </p>
            ` : ''}
          </div>
        </div>
      ` : ''}
      
      <!-- Line Items Table -->
      <div style="margin-bottom: 20px;">
        <h3 style="font-weight: bold; margin-bottom: 10px;">Items Logged</h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd; font-weight: bold;">Description</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd; font-weight: bold;">Item Number</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd; font-weight: bold;">Repair Number</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd; font-weight: bold;">Cost</th>
            </tr>
          </thead>
          <tbody>
            ${lineItemsHtml}
          </tbody>
        </table>
      </div>
      
      <!-- Images -->
      ${images && images.length > 0 ? `
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
      ` : ''}
    </div>
  `;
};

// Generate complete email HTML with proper doctype and head
export const generateEmailHtml = (log: Log, tenant: Tenant, imageBaseUrl: string, images: string[] = []): string => {
  const logHtml = generateLogHtml(log, tenant, imageBaseUrl, images);
  
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
        ${logHtml}
      </div>
    </body>
    </html>
  `;
};
