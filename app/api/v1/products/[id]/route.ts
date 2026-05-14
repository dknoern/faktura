import { NextRequest, NextResponse } from "next/server";
import { handleItemRoute, withApiAuth, isValidObjectId } from "@/lib/v1-route-helpers";
import { fetchProductById } from "@/lib/data";
import dbConnect from "@/lib/dbConnect";
import { productModel } from "@/lib/models/product";
import { getShortUser } from "@/lib/auth-utils";
import { getTenantObjectId } from "@/lib/tenant-utils";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleItemRoute(request, id, fetchProductById);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  return withApiAuth(request, async () => {
    await dbConnect();
    const tenantObjectId = await getTenantObjectId();
    const data = await request.json();

    const current = await productModel.findOne({ _id: id, tenantId: tenantObjectId });
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const now = new Date();
    data.lastUpdated = now;
    data.id = id;
    data.search = [data.itemNumber, data.title, data.manufacturer, data.model, data.serialNo]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    // Add a history entry when status changes to a tracked value
    const trackedStatuses = new Set(["At Show", "In Stock", "Sale Pending", "Incoming"]);
    if (data.status && data.status !== current.status && trackedStatuses.has(data.status)) {
      const actionMap: Record<string, string> = {
        "At Show": "item at show",
        "In Stock": "item in stock",
        "Sale Pending": "sale pending",
        "Incoming": "item incoming",
      };
      const username = await getShortUser();
      if (!data.history) data.history = current.history || [];
      data.history.push({ user: username, date: now, action: actionMap[data.status], refDoc: null });
    }

    const updated = await productModel.findOneAndUpdate(
      { _id: id, tenantId: tenantObjectId },
      data,
      { new: true, runValidators: true }
    );
    return NextResponse.json(JSON.parse(JSON.stringify(updated)));
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  return withApiAuth(request, async () => {
    await dbConnect();
    const tenantObjectId = await getTenantObjectId();
    const updated = await productModel.findOneAndUpdate(
      { _id: id, tenantId: tenantObjectId, status: { $ne: "Deleted" } },
      { status: "Deleted", lastUpdated: new Date() }
    );
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  });
}
