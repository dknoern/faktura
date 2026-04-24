import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Repair } from '@/lib/models/repair';
import { Proposal } from '@/lib/models/proposal';
import { Out } from '@/lib/models/out';
import { Tenant } from '@/lib/models/tenant';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await dbConnect();
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Search all three collections for the token
    const [repair, proposal, out] = await Promise.all([
      Repair.findOne({ esignToken: token }),
      Proposal.findOne({ esignToken: token }),
      Out.findOne({ esignToken: token }),
    ]);

    if (repair) {
      // Fetch tenant info for display
      const tenant = await Tenant.findOne({ _id: repair.tenantId });
      return NextResponse.json({
        type: 'repair',
        data: JSON.parse(JSON.stringify(repair)),
        tenant: tenant ? JSON.parse(JSON.stringify(tenant)) : null,
      });
    }

    if (proposal) {
      const tenant = await Tenant.findOne({ _id: proposal.tenantId });
      return NextResponse.json({
        type: 'proposal',
        data: JSON.parse(JSON.stringify(proposal)),
        tenant: tenant ? JSON.parse(JSON.stringify(tenant)) : null,
      });
    }

    if (out) {
      const tenant = await Tenant.findOne({ _id: out.tenantId });
      return NextResponse.json({
        type: 'out',
        data: JSON.parse(JSON.stringify(out)),
        tenant: tenant ? JSON.parse(JSON.stringify(tenant)) : null,
      });
    }

    return NextResponse.json(
      { error: 'Document not found or link has expired' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error fetching esign document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await dbConnect();
    const { token } = await params;
    const { signature } = await request.json();

    if (!token || !signature) {
      return NextResponse.json(
        { error: 'Token and signature are required' },
        { status: 400 }
      );
    }

    // Search all three collections for the token
    const [repair, proposal, out] = await Promise.all([
      Repair.findOne({ esignToken: token }),
      Proposal.findOne({ esignToken: token }),
      Out.findOne({ esignToken: token }),
    ]);

    if (repair) {
      if (repair.signature) {
        return NextResponse.json(
          { error: 'This document has already been signed' },
          { status: 400 }
        );
      }

      await Repair.findOneAndUpdate(
        { esignToken: token },
        {
          signature,
          signatureDate: new Date(),
          customerApprovedDate: new Date(),
          lastUpdated: new Date(),
        }
      );

      return NextResponse.json({
        success: true,
        type: 'repair',
        message: 'Repair proposal signed successfully',
      });
    }

    if (proposal) {
      if (proposal.signature) {
        return NextResponse.json(
          { error: 'This document has already been signed' },
          { status: 400 }
        );
      }

      await Proposal.findOneAndUpdate(
        { esignToken: token },
        {
          signature,
          signatureDate: new Date(),
          lastUpdated: new Date(),
        }
      );

      return NextResponse.json({
        success: true,
        type: 'proposal',
        message: 'Proposal signed successfully',
      });
    }

    if (out) {
      if (out.signature) {
        return NextResponse.json(
          { error: 'This document has already been signed' },
          { status: 400 }
        );
      }

      await Out.findOneAndUpdate(
        { esignToken: token },
        {
          signature,
          signatureDate: new Date(),
          lastUpdated: new Date(),
        }
      );

      return NextResponse.json({
        success: true,
        type: 'out',
        message: 'Log out item signed successfully',
      });
    }

    return NextResponse.json(
      { error: 'Document not found or link has expired' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error saving esign:', error);
    return NextResponse.json(
      { error: 'Failed to save signature' },
      { status: 500 }
    );
  }
}
