import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { RepairPdfDocument } from './repair-pdf';
import { Repair, Tenant } from '@/lib/repair-renderer';

/**
 * Generate a PDF buffer for a repair order, server-side.
 * Returns a Node.js Buffer containing the PDF bytes.
 */
export async function generateRepairPdfBuffer(
  repair: Repair,
  tenant: Tenant,
  logoUrl: string,
  imageUrls: string[] = [],
  showCustomerName: boolean = false
): Promise<Buffer> {
  const element = React.createElement(RepairPdfDocument, {
    repair,
    tenant,
    logoUrl,
    imageUrls,
    showCustomerName,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);
  return Buffer.from(buffer);
}

/**
 * Generate a PDF as a base64 string for a repair order, server-side.
 * Useful for email attachments.
 */
export async function generateRepairPdfBase64(
  repair: Repair,
  tenant: Tenant,
  logoUrl: string,
  imageUrls: string[] = [],
  showCustomerName: boolean = false
): Promise<string> {
  const buffer = await generateRepairPdfBuffer(repair, tenant, logoUrl, imageUrls, showCustomerName);
  return buffer.toString('base64');
}
