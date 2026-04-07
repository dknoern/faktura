import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { LogPdfDocument } from './log-pdf';
import { Log, Tenant } from '@/lib/log-renderer';

/**
 * Generate a PDF buffer for a log entry, server-side.
 * Returns a Node.js Buffer containing the PDF bytes.
 */
export async function generateLogPdfBuffer(
  log: Log,
  tenant: Tenant,
  logoUrl: string,
  imageUrls: string[] = []
): Promise<Buffer> {
  const element = React.createElement(LogPdfDocument, {
    log,
    tenant,
    logoUrl,
    imageUrls,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);
  return Buffer.from(buffer);
}

/**
 * Generate a PDF as a base64 string for a log entry, server-side.
 * Useful for email attachments.
 */
export async function generateLogPdfBase64(
  log: Log,
  tenant: Tenant,
  logoUrl: string,
  imageUrls: string[] = []
): Promise<string> {
  const buffer = await generateLogPdfBuffer(log, tenant, logoUrl, imageUrls);
  return buffer.toString('base64');
}
