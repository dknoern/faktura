import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { ProposalPdfDocument } from './proposal-pdf';
import { Proposal } from '@/lib/proposal-renderer';
import { Tenant } from '@/lib/invoice-renderer';

/**
 * Generate a PDF buffer for a proposal, server-side.
 * Returns a Node.js Buffer containing the PDF bytes.
 */
export async function generateProposalPdfBuffer(
  proposal: Proposal,
  tenant: Tenant,
  logoUrl: string
): Promise<Buffer> {
  const element = React.createElement(ProposalPdfDocument, {
    proposal,
    tenant,
    logoUrl,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);
  return Buffer.from(buffer);
}

/**
 * Generate a PDF as a base64 string for a proposal, server-side.
 * Useful for email attachments.
 */
export async function generateProposalPdfBase64(
  proposal: Proposal,
  tenant: Tenant,
  logoUrl: string
): Promise<string> {
  const buffer = await generateProposalPdfBuffer(proposal, tenant, logoUrl);
  return buffer.toString('base64');
}
