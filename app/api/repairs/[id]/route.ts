import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Repair } from '@/lib/models/repair';

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
    
    // Fetch repair by _id
    const repair: any = await Repair.findById(id).lean();
    
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
