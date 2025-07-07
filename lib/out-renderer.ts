// Out renderer utility functions

export interface Out {
  id?: string;
  _id?: string;
  date: Date | string;
  sentTo: string;
  description: string;
  comments?: string;
  user?: string;
  signature?: string;
  signatureDate?: Date | string;
  signatureUser?: string;
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

// Generate out HTML content
export const generateOutHtml = (out: Out, tenant: Tenant, imageBaseUrl: string): string => {
  const formattedDate = formatDate(out.date);
  
  const logoUrl = `${imageBaseUrl}/api/images/logo-${tenant._id}.png`;
  
  return `
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
      
      <!-- Out Information -->
      <div style="margin-bottom: 20px; margin-top: 15px;">
        <div style="margin-bottom: 15px;">
          <h3 style="font-weight: bold;">Log Out Entry Details</h3>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h4 style="font-weight: bold; margin-bottom: 5px;">Date & Time</h4>
          <p style="margin: 5px 0;">${formattedDate}</p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h4 style="font-weight: bold; margin-bottom: 5px;">Sent To</h4>
          <p style="margin: 5px 0;">${out.sentTo || 'Not specified'}</p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h4 style="font-weight: bold; margin-bottom: 5px;">Description</h4>
          <p style="margin: 5px 0;">${out.description || 'Not specified'}</p>
        </div>
        
        ${out.user ? `
          <div style="margin-bottom: 15px;">
            <h4 style="font-weight: bold; margin-bottom: 5px;">Logged By</h4>
            <p style="margin: 5px 0;">${out.user}</p>
          </div>
        ` : ''}
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
          <h3 style="font-weight: bold; margin-bottom: 10px;">Signature</h3>
          <div style="border: 1px solid #ddd; border-radius: 4px; padding: 15px; background-color: #f9f9f9;">
            <div style="background-color: white; border: 1px solid #ddd; border-radius: 4px; padding: 8px; display: inline-block;">
              <img src="${out.signature}" alt="Signature" style="height: 64px; object-fit: contain;" />
            </div>
            ${out.signatureDate ? `
              <p style="font-size: 10px; color: #666; margin-top: 8px;">
                Signed on ${new Date(out.signatureDate).toLocaleDateString()}
              </p>
            ` : ''}
          </div>
        </div>
      ` : ''}
    </div>
  `;
};

// Generate complete email HTML with proper doctype and head
export const generateEmailHtml = (out: Out, tenant: Tenant, imageBaseUrl: string): string => {
  const outHtml = generateOutHtml(out, tenant, imageBaseUrl);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .section { margin-bottom: 20px; }
        .section-title { font-weight: bold; font-size: 18px; margin-bottom: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        ${outHtml}
      </div>
    </body>
    </html>
  `;
};
