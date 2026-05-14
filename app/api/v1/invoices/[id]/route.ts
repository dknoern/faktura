import { NextRequest, NextResponse } from "next/server";
import { handleItemRoute, withApiAuth, isValidObjectId } from "@/lib/v1-route-helpers";
import { fetchInvoiceById } from "@/lib/data";
import { upsertInvoice } from "@/lib/actions/invoice-actions";
import dbConnect from "@/lib/dbConnect";
import { Invoice } from "@/lib/models/invoice";
import { getTenantObjectId } from "@/lib/tenant-utils";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleItemRoute(request, id, fetchInvoiceById);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  return withApiAuth(request, async () => {
    const body = await request.json();
    const result = await upsertInvoice(body, id);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }
    return NextResponse.json({ invoiceId: result.invoiceId, invoiceNumber: result.invoiceNumber });
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  return withApiAuth(request, async () => {
    await dbConnect();
    const tenantObjectId = await getTenantObjectId();
    const updated = await Invoice.findOneAndUpdate(
      { _id: id, tenantId: tenantObjectId, status: { $ne: "Deleted" } },
      { status: "Deleted" }
    );
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  });
}
