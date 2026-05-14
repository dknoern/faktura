import { NextRequest, NextResponse } from "next/server";
import { handleListRoute, withApiAuth } from "@/lib/v1-route-helpers";
import { fetchWanted } from "@/lib/data";
import dbConnect from "@/lib/dbConnect";
import { Wanted } from "@/lib/models/wanted";
import { getShortUser } from "@/lib/auth-utils";
import { getTenantObjectId } from "@/lib/tenant-utils";

export async function GET(request: NextRequest) {
  return handleListRoute(request, async (page, limit, search) => {
    const result = await fetchWanted(page, limit, search);
    return { data: result.wanted, pagination: result.pagination };
  });
}

export async function POST(request: NextRequest) {
  return withApiAuth(request, async () => {
    await dbConnect();
    const body = await request.json();
    const tenantObjectId = await getTenantObjectId();
    const createdBy = await getShortUser();

    const wanted = await Wanted.create({
      ...body,
      createdDate: new Date(),
      createdBy,
      tenantId: tenantObjectId,
    });

    return NextResponse.json(JSON.parse(JSON.stringify(wanted)), { status: 201 });
  });
}
