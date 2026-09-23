import { NextRequest, NextResponse } from "next/server";
import { handleItemRoute, withApiAuth, isValidObjectId } from "@/lib/v1-route-helpers";
import { fetchInvoiceById } from "@/lib/data";
import { upsertInvoice, deleteInvoice } from "@/lib/actions/invoice-actions";

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
    const result = await deleteInvoice(id);
    if (!result.success) {
      const status =
        result.code === "not_found" ? 404 :
        result.code === "has_payments" ? 409 :
        500;
      return NextResponse.json({ error: result.error }, { status });
    }
    return new NextResponse(null, { status: 204 });
  });
}
