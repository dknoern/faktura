import { NextRequest, NextResponse } from "next/server";
import { handleItemRoute, withApiAuth, isValidObjectId } from "@/lib/v1-route-helpers";
import { fetchRepairById } from "@/lib/data";
import { updateRepair } from "@/lib/actions/repair-actions";
import dbConnect from "@/lib/dbConnect";
import { Repair } from "@/lib/models/repair";
import { getTenantObjectId } from "@/lib/tenant-utils";

function toFormData(obj: Record<string, any>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      fd.append(key, String(value));
    }
  }
  return fd;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleItemRoute(request, id, fetchRepairById);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  return withApiAuth(request, async () => {
    const body = await request.json();
    // updateRepair looks up by repairId from FormData; repairNumber arg is informational only
    const formData = toFormData({ ...body, repairId: id });
    const result = await updateRepair(id, formData);
    if (!result.success) {
      return NextResponse.json({ error: (result as any).error ?? "Update failed" }, { status: 422 });
    }
    return NextResponse.json({ success: true });
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  return withApiAuth(request, async () => {
    await dbConnect();
    const tenantObjectId = await getTenantObjectId();
    const updated = await Repair.findOneAndUpdate(
      { _id: id, tenantId: tenantObjectId, status: { $ne: "Deleted" } },
      { status: "Deleted" }
    );
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  });
}
