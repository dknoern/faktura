import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { customerModel } from "@/lib/models/customer";
import { NextRequest } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    await dbConnect();
    const body = await request.json();
    const customerId = parseInt(params.id);

    if (!customerId) {
      return NextResponse.json(
        { error: "Invalid customer ID" },
        { status: 400 }
      );
    }

    // Update the customer
    const customer = await customerModel.findByIdAndUpdate(
      customerId,
      {
        ...body,
        lastUpdated: new Date(),
        search: `${body.firstName} ${body.lastName} ${body.company} ${body.email} ${body.phone}`.toLowerCase(),
      },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(customer, { status: 200 });
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
} 