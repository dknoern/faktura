import { NextRequest, NextResponse } from "next/server";
import { handleItemRoute, withApiAuth, isValidObjectId } from "@/lib/v1-route-helpers";
import { fetchCustomerById } from "@/lib/data";
import { updateCustomer, deleteCustomer } from "@/lib/actions/customer-actions";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleItemRoute(request, id, (id) => fetchCustomerById(id, { includeDeleted: true }));
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  return withApiAuth(request, async () => {
    const body = await request.json();
    const result = await updateCustomer(id, body);
    if (!result.success) {
      const status = result.error === "Customer not found" ? 404 : 422;
      return NextResponse.json(
        { error: result.error, ...(result.fieldErrors && { fieldErrors: result.fieldErrors }) },
        { status }
      );
    }
    return NextResponse.json(result.data);
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  return withApiAuth(request, async () => {
    const result = await deleteCustomer(id);
    if (!result.success) {
      const status = result.error === "Customer not found" ? 404 : 409;
      return NextResponse.json({ error: result.error }, { status });
    }
    return new NextResponse(null, { status: 204 });
  });
}
