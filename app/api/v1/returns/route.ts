import { NextRequest, NextResponse } from "next/server";
import { handleListRoute, withApiAuth } from "@/lib/v1-route-helpers";
import { fetchReturns } from "@/lib/data";
import { createReturn } from "@/lib/actions/return-actions";

export async function GET(request: NextRequest) {
  return handleListRoute(request, async (page, limit, search) => {
    const result = await fetchReturns(page, limit, search);
    return { data: result.returns, pagination: result.pagination };
  });
}

export async function POST(request: NextRequest) {
  return withApiAuth(request, async () => {
    const body = await request.json();
    const result = await createReturn(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }
    return NextResponse.json(result.data, { status: 201 });
  });
}
