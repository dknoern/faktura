import { NextRequest, NextResponse } from "next/server";
import { handleListRoute, withApiAuth } from "@/lib/v1-route-helpers";
import { fetchInvoices } from "@/lib/data";
import { upsertInvoice } from "@/lib/actions/invoice-actions";

export async function GET(request: NextRequest) {
  return handleListRoute(request, async (page, limit, search) => {
    const result = await fetchInvoices(page, limit, search);
    return { data: result.invoices, pagination: result.pagination };
  });
}

export async function POST(request: NextRequest) {
  return withApiAuth(request, async () => {
    const body = await request.json();
    const result = await upsertInvoice(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }
    return NextResponse.json({ invoiceId: result.invoiceId, invoiceNumber: result.invoiceNumber }, { status: 201 });
  });
}
