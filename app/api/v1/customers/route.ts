import { NextRequest, NextResponse } from "next/server";
import { handleListRoute, withApiAuth } from "@/lib/v1-route-helpers";
import { fetchCustomers } from "@/lib/data";
import { createCustomer } from "@/lib/actions/customer-actions";

export async function GET(request: NextRequest) {
  return handleListRoute(request, async (page, limit, search) => {
    const result = await fetchCustomers(page, limit, search, { includeDeleted: true });
    return { data: result.customers, pagination: result.pagination };
  });
}

export async function POST(request: NextRequest) {
  return withApiAuth(request, async () => {
    const body = await request.json();
    const result = await createCustomer(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, ...(result.fieldErrors && { fieldErrors: result.fieldErrors }) },
        { status: 422 }
      );
    }
    return NextResponse.json(result.data, { status: 201 });
  });
}
