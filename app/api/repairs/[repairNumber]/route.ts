import { NextResponse } from 'next/server';
import { fetchRepairByNumber, fetchDefaultTenant } from '@/lib/data';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ repairNumber: string }> }
) {
  try {
    // Await params before using its properties
    const repairNumber = (await params).repairNumber;
    
    if (!repairNumber) {
      return NextResponse.json(
        { error: 'Invalid repair number' },
        { status: 400 }
      );
    }
    
    const repair = await fetchRepairByNumber(repairNumber);
    const tenant = await fetchDefaultTenant();
    
    if (!repair) {
      return NextResponse.json(
        { error: 'Repair not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      repair,
      tenant
    });
  } catch (error) {
    console.error('Error fetching repair data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repair data' },
      { status: 500 }
    );
  }
}
