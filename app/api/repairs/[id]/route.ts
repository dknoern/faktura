import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Repair } from '@/lib/models/repair';
import { getShortUser } from '@/lib/auth-utils';
import { getTenantObjectId } from '@/lib/tenant-utils';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Invalid repair ID' },
        { status: 400 }
      );
    }
    
    await dbConnect();
    
    const tenantObjectId = await getTenantObjectId();
    // Fetch repair by _id
    const repair: any = await Repair.findOne({ _id: id, tenantId: tenantObjectId }).lean();
    
    if (!repair) {
      return NextResponse.json(
        { error: 'Repair not found' },
        { status: 404 }
      );
    }
    
    // Convert MongoDB document to plain object
    const repairData = {
      ...repair,
      _id: repair._id.toString(),
      dateOut: repair.dateOut ? new Date(repair.dateOut).toISOString() : null,
      customerApprovedDate: repair.customerApprovedDate ? new Date(repair.customerApprovedDate).toISOString() : null,
      returnDate: repair.returnDate ? new Date(repair.returnDate).toISOString() : null,
    };
    
    return NextResponse.json(repairData);
  } catch (error) {
    console.error('Error fetching repair details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repair details' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Invalid repair ID' },
        { status: 400 }
      );
    }
    
    await dbConnect();
    
    // Get current user for tracking
    const user = await getShortUser();
    
    const tenantObjectId = await getTenantObjectId();
    // Perform soft delete by updating status to "Deleted" and setting lastUpdated
    const updatedRepair = await Repair.findOneAndUpdate(
      { _id: id, tenantId: tenantObjectId },
      { 
        status: 'Deleted',
        lastUpdated: new Date()
      },
      { new: true }
    );
    
    if (!updatedRepair) {
      return NextResponse.json(
        { error: 'Repair not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Repair deleted successfully',
      deletedBy: user
    });
  } catch (error) {
    console.error('Error deleting repair:', error);
    return NextResponse.json(
      { error: 'Failed to delete repair' },
      { status: 500 }
    );
  }
}
