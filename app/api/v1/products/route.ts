import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/apiAuth";
import { tenantContextStorage } from "@/lib/auth-utils";
import { parseListParams, withApiAuth } from "@/lib/v1-route-helpers";
import { fetchProducts } from "@/lib/data";
import dbConnect from "@/lib/dbConnect";
import { productModel } from "@/lib/models/product";
import mongoose from "mongoose";
import { getShortUser } from "@/lib/auth-utils";
import { getTenantObjectId } from "@/lib/tenant-utils";

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if (auth instanceof NextResponse) return auth;

  const { page, limit, search } = parseListParams(request);
  const { searchParams } = new URL(request.url);
  const sortBy = searchParams.get("sortBy") ?? "lastUpdated";
  const sortOrder = searchParams.get("sortOrder") ?? "desc";

  try {
    const result = await tenantContextStorage.run({ tenantId: auth.tenantId }, () =>
      fetchProducts(page, limit, search, sortBy, sortOrder)
    );
    return NextResponse.json({ data: result.products, total: result.pagination.total, page, limit });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return withApiAuth(request, async () => {
    await dbConnect();
    const data = await request.json();

    if (typeof data.itemNumber === "string") {
      data.itemNumber = data.itemNumber.trim();
    }
    if (!data.itemNumber) {
      return NextResponse.json({ error: "itemNumber is required" }, { status: 400 });
    }

    const tenantObjectId = await getTenantObjectId();
    const existing = await productModel.findOne({ itemNumber: data.itemNumber, tenantId: tenantObjectId });
    if (existing) {
      return NextResponse.json(
        { error: `A product with item number '${data.itemNumber}' already exists` },
        { status: 409 }
      );
    }

    const username = await getShortUser();
    const now = new Date();
    const newProduct = await productModel.create({
      ...data,
      lastUpdated: now,
      id: new mongoose.Types.ObjectId().toString(),
      tenantId: tenantObjectId,
      search: [data.itemNumber, data.title, data.manufacturer, data.model, data.serialNo]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
      history: [
        {
          user: username,
          date: now,
          action: "entered",
          search: [now.toISOString().split("T")[0], username].filter(Boolean).join(" ").toLowerCase(),
        },
      ],
    });

    return NextResponse.json(JSON.parse(JSON.stringify(newProduct)), { status: 201 });
  });
}
