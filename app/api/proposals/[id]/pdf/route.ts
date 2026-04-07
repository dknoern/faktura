import { NextRequest, NextResponse } from 'next/server';
import { fetchProposalById, fetchTenantById } from '@/lib/data';
import { getTenantId } from '@/lib/auth-utils';
import { getImageHost } from '@/lib/utils/imageHost';
import { generateProposalPdfBuffer } from '@/lib/pdf/generate-proposal-pdf';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const proposalId = resolvedParams.id;

  try {
    const [tenantId, imageHost] = await Promise.all([
      getTenantId(),
      getImageHost(),
    ]);

    const [proposal, tenant] = await Promise.all([
      fetchProposalById(proposalId),
      fetchTenantById(tenantId),
    ]);

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const logoUrl = `${imageHost}/api/images/logo-${tenant._id}.png`;
    const pdfBuffer = await generateProposalPdfBuffer(proposal, tenant, logoUrl);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Proposal-${proposal.customerLastName}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating proposal PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
