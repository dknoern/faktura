import { NextRequest, NextResponse } from "next/server";
import { handleItemRoute, withApiAuth, isValidObjectId } from "@/lib/v1-route-helpers";
import { fetchWantedById } from "@/lib/data";
import dbConnect from "@/lib/dbConnect";
import { Wanted } from "@/lib/models/wanted";
import { getTenantObjectId } from "@/lib/tenant-utils";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleItemRoute(request, id, fetchWantedById);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  return withApiAuth(request, async () => {
    await dbConnect();
    const tenantObjectId = await getTenantObjectId();
    const body = await request.json();

    const updated = await Wanted.findOneAndUpdate(
      { _id: id, tenantId: tenantObjectId, status: { $ne: "Deleted" } },
      { ...body, tenantId: tenantObjectId },
      { new: true, runValidators: true }
    );
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(JSON.parse(JSON.stringify(updated)));
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  return withApiAuth(request, async () => {
    await dbConnect();
    const tenantObjectId = await getTenantObjectId();
    const updated = await Wanted.findOneAndUpdate(
      { _id: id, tenantId: tenantObjectId, status: { $ne: "Deleted" } },
      { status: "Deleted" }
    );
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  });
}
