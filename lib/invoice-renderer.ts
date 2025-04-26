// Invoice renderer utility
// Generates plain HTML for invoice content that can be used in both email and web views

export interface LineItem {
  itemNumber: string;
  name: string;
  amount: number;
  serialNumber?: string;
  longDesc?: string;
}

export interface Invoice {
  _id: number;
  customerFirstName: string;
  customerLastName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  invoiceType: string;
  paymentMethod: string;
  lineItems: LineItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  date: string;
  shipAddress1: string;
  shipAddress2: string;
  shipAddress3: string;
  shipCity: string;
  shipState: string;
  shipZip: string;
  billingAddress1: string;
  billingAddress2: string;
  billingAddress3: string;
  billingCity: string;
  billingState: string;
  billingZip: string;
  customerPhone: string;
  trackingNumber: string;
  customerEmail: string;
  taxExempt: boolean;
  customerId: string;
}

export interface Tenant {
  _id?: string | number;
  nameLong?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  website?: string;
  warranty?: string;
  returnPolicy?: string;
  bankWireTransferInstructions?: string;
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
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

// Generate line items HTML
export const generateLineItemsHtml = (lineItems: LineItem[]) => {
  return lineItems.map((item) => {
    const amount = formatCurrency(item.amount);
    return `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee; font-size: 12px;">${item.name.toUpperCase()}<p>${item.longDesc || ''}</p></td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-size: 12px; vertical-align: top;">${amount}</td>
      </tr>
    `;
  }).join('');
};


// Generate invoice HTML content
export const generateInvoiceHtml = (invoice: Invoice, tenant: Tenant, imageBaseUrl: string): string => {
  const formattedDate = formatDate(invoice.date);
  const formattedTotal = formatCurrency(invoice.total);
  const lineItemsHtml = generateLineItemsHtml(invoice.lineItems);

  const logoUrl = `${imageBaseUrl}/api/images/logo-${tenant._id}.png`;

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto;">

    <!-- Header -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">

        <div>
          <img src="${logoUrl}" height="76px" width="190px" alt="Company Logo" />
          <div style="color: #B69D57; font-size: 24px; margin-top: 10px;">INVOICE</div>
        </div>
        <div style="text-align: right;">
          <p style="margin: 1px 0;">Invoice #${invoice._id}</p>
          <p style="margin: 1px 0;">Date: ${formattedDate}</p>
          <p style="margin: 1px 0;">Method of Sale: ${invoice.invoiceType}</p>
          ${invoice.paymentMethod ? `<p style="margin: 5px 0;">Paid By: ${invoice.paymentMethod}</p>` : ''}
        </div>
      </div>


      

      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">


        <div style="margin-bottom: 20px; width: 50%;">
          <p style="margin: 0 0;">${invoice.customerFirstName} ${invoice.customerLastName}</p>
          <p style="margin: 0 0;">${invoice.shipAddress1 || ''}</p>
          <p style="margin: 0 0;">${invoice.shipAddress2 || ''}</p>
          <p style="margin: 0 0;">${invoice.shipCity || ''}${invoice.shipState ? ', ' + invoice.shipState : ''} ${invoice.shipZip || ''}</p>
          <p style="margin: 0 0;">${invoice.customerPhone || ''}</p>
          <p style="margin: 0 0;">${invoice.customerEmail || ''}</p>
        </div>

        <div style="margin-bottom: 20px; width: 50%; align-items: left;">
          <p style="font-weight: bold; margin-bottom: 0;">${invoice.billingAddress1 ? 'BILLING ADDRESS' : ''}</p>
          <p style="margin: 0 0;">${invoice.billingAddress1 || ''}</p>
          <p style="margin: 0 0;">${invoice.billingAddress2 || ''}</p>
          <p style="margin: 0 0;">${invoice.billingCity || ''}${invoice.billingState ? ', ' + invoice.billingState : ''} ${invoice.billingZip || ''}</p>
        </div>
      </div>
      
      <!-- Items -->
      <div style="margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 8px; border-bottom: 2px solid #eee;">ITEM DESCRIPTION</th>
              <th style="text-align: right; paddin g: 8px; border-bottom: 2px solid #eee;">TOTAL</th>
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
                    <td style="text-align: right; width: 100px;">${formatCurrency(invoice.subtotal)}</td>
                  </tr>
                  <tr>
                    <td style="text-align: right;">Tax:</td>
                    <td style="text-align: right;">${formatCurrency(invoice.tax)}</td>
                  </tr>
                  <tr>
                    <td style="text-align: right;">Shipping:</td>
                    <td style="text-align: right;">${formatCurrency(invoice.shipping)}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="background-color: #B69D57; color: white; padding: 8px; text-align: right; margin-top: 10px;">
                      <strong>TOTAL: ${formattedTotal}</strong>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <!-- Warranty and Return Policy -->
      <div style="margin-bottom: 20px; font-size: 14px;">
        <div style="margin-bottom: 10px;">
          <div style="font-weight: bold;">Warranty:</div>
          <p style="color: #666;">${tenant.warranty || 'N/A'}</p>
        </div>
        <div>
          <div style="font-weight: bold;">Return Privilege:</div>
          <p style="color: #666;">${tenant.returnPolicy || 'N/A'}</p>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px;">
        <div>
          <div style="font-weight: bold; margin-bottom: 5px;">PHONE</div>
          <p>${tenant.phone || 'N/A'}</p>
        </div>
        <div>
          <div style="font-weight: bold; margin-bottom: 5px;">ADDRESS</div>
          <p>${tenant.address || ''}</p>
          <p>${tenant.city || ''}, ${tenant.state || ''} ${tenant.zip || ''}</p>
        </div>
        <div>
          <div style="font-weight: bold; margin-bottom: 5px;">WEB</div>
          <p>${tenant.website || 'N/A'}</p>
        </div>
      </div>
      
      <!-- Bank Wire Transfer Instructions -->
      <div style="font-size: 14px;">
        <div>BANK WIRE TRANSFER INSTRUCTIONS</div>
        <p>${tenant.bankWireTransferInstructions || 'N/A'}</p>
      </div>
    </div>
  `;
};

// Generate complete email HTML with proper doctype and head
export const generateEmailHtml = (invoice: Invoice, tenant: Tenant, imageBaseUrl: string): string => {
  const invoiceHtml = generateInvoiceHtml(invoice, tenant, imageBaseUrl);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        ${invoiceHtml}
      </div>
    </body>
    </html>
  `;
};

