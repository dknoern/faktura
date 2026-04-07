import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { OutPdfDocument } from './out-pdf';
import { Out, Tenant } from '@/lib/out-renderer';

/**
 * Generate a PDF buffer for a log out entry, server-side.
 * Returns a Node.js Buffer containing the PDF bytes.
 */
export async function generateOutPdfBuffer(
  out: Out,
  tenant: Tenant,
  logoUrl: string,
  imageUrls: string[] = []
): Promise<Buffer> {
  const element = React.createElement(OutPdfDocument, {
    out,
    tenant,
    logoUrl,
    imageUrls,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);
  return Buffer.from(buffer);
}

/**
 * Generate a PDF as a base64 string for a log out entry, server-side.
 * Useful for email attachments.
 */
export async function generateOutPdfBase64(
  out: Out,
  tenant: Tenant,
  logoUrl: string,
  imageUrls: string[] = []
): Promise<string> {
  const buffer = await generateOutPdfBuffer(out, tenant, logoUrl, imageUrls);
  return buffer.toString('base64');
}
