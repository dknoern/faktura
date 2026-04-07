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
  _id: string;
  invoiceNumber: number;
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
  customerNumber?: number;
  salesPerson: string;
  methodOfSale: string;
  paidBy: string;
  authNumber: string;
  copyAddress: boolean;
  shipVia: string;
}

export type { Tenant } from '@/lib/types/tenant';

// Format currency values
export const formatCurrency = (value: number | null | undefined = 0) => {
  const numValue = value ?? 0;
  return numValue.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  });
};

// Format date values with time
export const formatDate = (dateString: string) => {
  // Get timezone from environment variable, default to Central timezone
  const timeZone = process.env.TIMEZONE || 'America/Chicago';
  
  return new Date(dateString).toLocaleString('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};


