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
  salesPerson: string;
  methodOfSale: string;
  paidBy: string;
  authNumber: string;
  copyAddress: boolean;
  shipVia: string;
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

// Format date values with time
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString(undefined, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Generate line items HTML
export const generateLineItemsHtml = (lineItems: LineItem[]) => {
  return lineItems.map((item) => {
    const amount = formatCurrency(item.amount);
    return `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee; font-size: 12px;">${item.name.toUpperCase()}<p>${item.longDesc || ''}</p>
          <p style="width: 25%; display: inline-block; padding-left: 10px;">${item.serialNumber ? `Serial No: ${item.serialNumber}` : ''}</p>
          <p style="width: 25%; display: inline-block; padding-left: 10px;">${item.itemNumber ? `SKU: ${item.itemNumber}` : ''}</p>
        </td>
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

  const invoiceLabel = invoice.invoiceType === 'Partner' ? 'PARTNER INVOICE' : invoice.invoiceType === 'Memo' ? 'MEMO' : 'INVOICE';

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; font-size: 12px">

    <!-- Header -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">

        <div>
          <img src="${logoUrl}" height="76px" width="190px" alt="Company Logo" />
          <div style="color: #B69D57; font-size: 24px; margin-top: 10px;">${invoiceLabel}
          </div>
        </div>
        <div style="text-align: left;">
          <p style="margin: 1px 0;">Invoice #${invoice._id}</p>
          <p style="margin: 1px 0;">Date: ${formattedDate}</p>
          ${invoice.shipVia ? `<p style="margin: 1px 0;">Ship Via: ${invoice.shipVia}</p>` : ''}
          ${invoice.trackingNumber ? `<p style="margin: 1px 0;">Tracking Number: ${invoice.trackingNumber}</p>` : ''}
          ${invoice.salesPerson ? `<p style="margin: 1px 0;">Sold By: ${invoice.salesPerson}</p>` : ''}
          ${invoice.methodOfSale ? `<p style="margin: 1px 0;">Method of Sale: ${invoice.methodOfSale}</p>` : ''}
          ${invoice.paidBy ? `<p style="margin: 1px 0;">Paid By: ${invoice.paidBy}</p>` : ''}
          ${invoice.authNumber ? `<p style="margin: 1px 0;">Auth #: ${invoice.authNumber}</p>` : ''}
        </div>
      </div>


      

      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">


        <div style="margin-bottom: 20px; width: 50%;">
          <p style="margin: 0 0; text-transform: uppercase; font-weight: bold;">${invoice.customerFirstName} ${invoice.customerLastName}</p>
          <p style="margin: 0 0; text-transform: uppercase; font-weight: bold;">${invoice.shipAddress1 || ''}</p>
          <p style="margin: 0 0; text-transform: uppercase; font-weight: bold;">${invoice.shipAddress2 || ''}</p>
          <p style="margin: 0 0; text-transform: uppercase; font-weight: bold;">${invoice.shipCity || ''}${invoice.shipState ? ', ' + invoice.shipState : ''} ${invoice.shipZip || ''}</p>
          <p style="margin: 0 0; text-transform: uppercase; font-weight: bold;">${invoice.customerPhone || ''}</p>
          <p style="margin: 0 0; text-transform: uppercase; font-weight: bold;">${invoice.customerEmail || ''}</p>
        </div>

        ${!invoice.copyAddress ? `
        <div style="margin-bottom: 20px; width: 50%; align-items: left;">
          <p style="margin: 0 0; text-transform: uppercase; font-weight: bold; margin-bottom: 0;">${invoice.billingAddress1 ? 'BILLING ADDRESS' : ''}</p>
          <p style="margin: 0 0; text-transform: uppercase;">${invoice.billingAddress1 || ''}</p>
          <p style="margin: 0 0; text-transform uppercase;">${invoice.billingAddress2 || ''}</p>
          <p style="margin: 0 0; text-transform uppercase;">${invoice.billingCity || ''}${invoice.billingState ? ', ' + invoice.billingState : ''} ${invoice.billingZip || ''}</p>
        </div>
        ` : ''}
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
                    <td style="text-align: right;">SUBTOTAL:</td>
                    <td style="text-align: right; width: 100px;">${formatCurrency(invoice.subtotal)}</td>
                  </tr>
                  <tr>
                    <td style="text-align: right;">TAX:</td>
                    <td style="text-align: right;">${formatCurrency(invoice.tax)}</td>
                  </tr>
                  <tr>
                    <td style="text-align: right;">SHIPPING:</td>
                    <td style="text-align: right;">${formatCurrency(invoice.shipping)}</td>
                  </tr>
                  <tr>
                    <td style="text-align: right; "><p style="font-weight: bold; font-size: 14px;">TOTAL DUE:</p></td>
                    <td style="text-align: right; font-weight: bold; font-size: 14px;"> <strong>${formattedTotal}</strong></td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding-top: 40px; text-align: right;">
                      Thank you for your business
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <!-- Warranty and Return Policy -->
      <div style="margin-bottom: 15px; font-size: 12px; border-bottom: 2px solid #eee;">
        <div style="margin-bottom: 10px;">
          <div style="font-weight: bold;">Warranty:</div>
          <p style="color: #666;">${tenant.warranty || 'N/A'}</p>
        </div>
        <div style="margin-bottom: 10px;">
          <div style="font-weight: bold;">Return Privilege:</div>
          <p style="color: #666;">${tenant.returnPolicy || 'N/A'}</p>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px;">
        <div style="display: flex;">
          <div style="margin-right: 10px; color: #B69D57;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
          </div>
          <div>
            <div style="font-weight: bold; margin-bottom: 0px;">PHONE</div>
            <p>${tenant.phone || 'N/A'}</p>
          </div>
        </div>
        <div style="display: flex;">
          <div style="margin-right: 10px; color: #B69D57;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
          <div>
            <div style="font-weight: bold; margin-bottom: 0px;">ADDRESS</div>
            <p>${tenant.address || ''}</p>
            <p>${tenant.city || ''}, ${tenant.state || ''} ${tenant.zip || ''}</p>
          </div>
        </div>
        <div style="display: flex;">
          <div style="margin-right: 10px; color: #B69D57;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
          </div>
          <div>
            <div style="font-weight: bold; margin-bottom: 0px;">WEB</div>
            <p>${tenant.website || 'N/A'}</p>
          </div>
        </div>
      </div>
      
      <!-- Bank Wire Transfer Instructions -->
      <div style="font-size: 12px; border-bottom: 2px solid #eee; padding-bottom: 20px;">
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

