import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/dbConnect';
import { Repair } from '@/lib/models/repair';
import { getShortUser } from '@/lib/auth-utils';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { vendor } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Repair ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Get current user for history tracking
    const user = await getShortUser();

    // Find and update the repair by _id
    const repair = await Repair.findByIdAndUpdate(
      id,
      { 
        vendor: vendor || '', // Set to empty string if vendor is null/undefined
        lastUpdated: new Date()
      },
      { new: true }
    );

    if (!repair) {
      return NextResponse.json({ error: 'Repair not found' }, { status: 404 });
    }

    // Add history entry for vendor change
    const historyEntry = {
      user: user || 'System',
      date: new Date(),
      action: vendor ? `Vendor changed to ${vendor}` : 'Vendor removed',
      refDoc: repair._id
    };

    // Update repair with history entry
    await Repair.findByIdAndUpdate(
      id,
      { 
        $push: { history: historyEntry }
      }
    );

    return NextResponse.json({ 
      success: true, 
      repair: {
        _id: repair._id,
        vendor: repair.vendor
      }
    });

  } catch (error) {
    console.error('Error updating repair vendor:', error);
    return NextResponse.json(
      { error: 'Failed to update repair vendor' },
      { status: 500 }
    );
  }
}
