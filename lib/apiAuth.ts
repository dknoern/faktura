import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { ApiKey } from "@/lib/models/apiKey";
import { hashApiKey } from "@/lib/api-key-utils";

type AuthSuccess = { tenantId: string };

export async function authenticateApiKey(
  request: NextRequest
): Promise<AuthSuccess | NextResponse> {
  const authorization = request.headers.get("authorization");

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return NextResponse.json({ error: "API key required" }, { status: 401 });
  }

  const raw = authorization.slice(7);
  if (!raw) {
    return NextResponse.json({ error: "API key required" }, { status: 401 });
  }

  await dbConnect();
  const keyHash = hashApiKey(raw);
  const apiKey = await ApiKey.findOne({ keyHash });

  if (!apiKey) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  // Update last-used timestamp (fire-and-forget — don't block the request)
  ApiKey.updateOne({ _id: apiKey._id }, { lastUsedAt: new Date() }).catch(() => {});

  return { tenantId: apiKey.tenantId.toString() };
}
