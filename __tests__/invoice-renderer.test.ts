import { describe, it, expect } from '@jest/globals';
import { generateInvoiceHtml, Invoice, Tenant } from '@/lib/invoice-renderer';

describe('generateInvoiceHtml', () => {
  const mockTenant: Tenant = {
    _id: 1,
    nameLong: 'Test Company',
    email: 'test@example.com',
    phone: '555-1234',
    address: '123 Main St',
    city: 'Test City',
    state: 'TX',
    zip: '12345',
    website: 'https://example.com',
    warranty: 'Test warranty policy',
    returnPolicy: 'Test return policy',
    bankWireTransferInstructions: 'Test wire instructions'
  };

  const mockInvoice: Invoice = {
    _id: 16983,
    customerFirstName: 'Don',
    customerLastName: 'Fite',
    address: '3301 S. 14th Street',
    city: 'Abilene',
    state: 'TX',
    zip: '79605',
    invoiceType: 'Invoice',
    paymentMethod: 'Other',
    lineItems: [
      {
        itemNumber: '64385',
        name: 'ROLEX DATEJUST',
        amount: 15900.00,
        serialNumber: 'E40353M9',
        longDesc: 'Rolex Datejust Men\'s 2-Tone Steel & Gold Watch Diamond Dial 116243'
      }
    ],
    subtotal: 15900.00,
    tax: 0.00,
    shipping: 0.00,
    total: 15900.00,
    date: '2025-10-20T08:13:00.000Z',
    shipAddress1: 'ETIF INC',
    shipAddress2: '3301 S. 14th Street',
    shipAddress3: 'Suite 16 PMB 323',
    shipCity: 'Abilene',
    shipState: 'TX',
    shipZip: '79605',
    billingAddress1: 'ETIF INC',
    billingAddress2: '3301 S. 14th Street',
    billingAddress3: 'Suite 16 PMB 323',
    billingCity: 'Abilene',
    billingState: 'TX',
    billingZip: '79605',
    customerPhone: '3256691544',
    trackingNumber: '',
    customerEmail: 'jlt.busch@yahoo.com',
    taxExempt: true,
    customerId: '1',
    salesPerson: 'Mari Jo Rhue',
    methodOfSale: 'Online',
    paidBy: 'Other',
    authNumber: '',
    copyAddress: false,
    shipVia: ''
  };

  describe('Address line 2 and 3 rendering', () => {
    it('should include shipAddress2 in the rendered HTML', () => {
      const html = generateInvoiceHtml(mockInvoice, mockTenant, 'http://example.com');
      
      expect(html).toContain('3301 S. 14th Street');
    });

    it('should include shipAddress3 in the rendered HTML', () => {
      const html = generateInvoiceHtml(mockInvoice, mockTenant, 'http://example.com');
      
      expect(html).toContain('Suite 16 PMB 323');
    });

    it('should include billingAddress2 when copyAddress is false', () => {
      const html = generateInvoiceHtml(mockInvoice, mockTenant, 'http://example.com');
      
      expect(html).toContain('BILLING ADDRESS');
      expect(html).toContain('3301 S. 14th Street');
    });

    it('should include billingAddress3 when copyAddress is false', () => {
      const html = generateInvoiceHtml(mockInvoice, mockTenant, 'http://example.com');
      
      expect(html).toContain('Suite 16 PMB 323');
    });

    it('should handle empty address2 and address3 fields', () => {
      const invoiceWithNoAddress2Or3: Invoice = {
        ...mockInvoice,
        shipAddress2: '',
        shipAddress3: '',
        billingAddress2: '',
        billingAddress3: ''
      };
      
      const html = generateInvoiceHtml(invoiceWithNoAddress2Or3, mockTenant, 'http://example.com');
      
      // Should still generate HTML without errors
      expect(html).toContain('ETIF INC');
      expect(html).toContain('Abilene');
    });

    it('should not show billing address section when copyAddress is true', () => {
      const invoiceWithCopyAddress: Invoice = {
        ...mockInvoice,
        copyAddress: true
      };
      
      const html = generateInvoiceHtml(invoiceWithCopyAddress, mockTenant, 'http://example.com');
      
      expect(html).not.toContain('BILLING ADDRESS');
    });
  });

  describe('Address field ordering', () => {
    it('should display shipping address fields in correct order', () => {
      const html = generateInvoiceHtml(mockInvoice, mockTenant, 'http://example.com');
      
      // Verify the order by checking the positions in the HTML string
      const address1Pos = html.indexOf('ETIF INC');
      const address2Pos = html.indexOf('3301 S. 14th Street', address1Pos);
      const address3Pos = html.indexOf('Suite 16 PMB 323', address2Pos);
      const cityPos = html.indexOf('Abilene', address3Pos);
      
      expect(address1Pos).toBeGreaterThan(-1);
      expect(address2Pos).toBeGreaterThan(address1Pos);
      expect(address3Pos).toBeGreaterThan(address2Pos);
      expect(cityPos).toBeGreaterThan(address3Pos);
    });

    it('should display billing address fields in correct order when shown', () => {
      const html = generateInvoiceHtml(mockInvoice, mockTenant, 'http://example.com');
      
      const billingHeaderPos = html.indexOf('BILLING ADDRESS');
      const address1Pos = html.indexOf('ETIF INC', billingHeaderPos);
      const address2Pos = html.indexOf('3301 S. 14th Street', address1Pos);
      const address3Pos = html.indexOf('Suite 16 PMB 323', address2Pos);
      
      expect(billingHeaderPos).toBeGreaterThan(-1);
      expect(address1Pos).toBeGreaterThan(billingHeaderPos);
      expect(address2Pos).toBeGreaterThan(address1Pos);
      expect(address3Pos).toBeGreaterThan(address2Pos);
    });
  });
});
