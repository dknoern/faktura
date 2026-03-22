import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { InvoicePdfDocument } from './invoice-pdf';
import { Invoice, Tenant } from '@/lib/invoice-renderer';

/**
 * Generate a PDF buffer for an invoice, server-side.
 * Returns a Node.js Buffer containing the PDF bytes.
 */
export async function generateInvoicePdfBuffer(
  invoice: Invoice,
  tenant: Tenant,
  logoUrl: string
): Promise<Buffer> {
  const element = React.createElement(InvoicePdfDocument, {
    invoice,
    tenant,
    logoUrl,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);
  return Buffer.from(buffer);
}

/**
 * Generate a PDF as a base64 string for an invoice, server-side.
 * Useful for email attachments.
 */
export async function generateInvoicePdfBase64(
  invoice: Invoice,
  tenant: Tenant,
  logoUrl: string
): Promise<string> {
  const buffer = await generateInvoicePdfBuffer(invoice, tenant, logoUrl);
  return buffer.toString('base64');
}
