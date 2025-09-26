import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { logModel } from '@/lib/models/log';
import { getShortUser } from '@/lib/auth-utils';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Invalid log ID' },
        { status: 400 }
      );
    }
    
    await dbConnect();
    
    // Fetch log by _id
    const log: any = await logModel.findById(id).lean();
    
    if (!log) {
      return NextResponse.json(
        { error: 'Log not found' },
        { status: 404 }
      );
    }
    
    // Convert MongoDB document to plain object
    const logData = {
      ...log,
      _id: log._id.toString(),
      date: log.date ? new Date(log.date).toISOString() : null,
      signatureDate: log.signatureDate ? new Date(log.signatureDate).toISOString() : null,
      lastUpdated: log.lastUpdated ? new Date(log.lastUpdated).toISOString() : null,
    };
    
    return NextResponse.json(logData);
  } catch (error) {
    console.error('Error fetching log details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch log details' },
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
        { error: 'Invalid log ID' },
        { status: 400 }
      );
    }
    
    await dbConnect();
    
    // Get current user for tracking
    const user = await getShortUser();
    
    // Perform soft delete by updating status to "Deleted" and setting lastUpdated
    const updatedLog = await logModel.findByIdAndUpdate(
      id,
      { 
        status: 'Deleted',
        lastUpdated: new Date()
      },
      { new: true }
    );
    
    if (!updatedLog) {
      return NextResponse.json(
        { error: 'Log not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Log deleted successfully',
      deletedBy: user
    });
  } catch (error) {
    console.error('Error deleting log:', error);
    return NextResponse.json(
      { error: 'Failed to delete log' },
      { status: 500 }
    );
  }
}
