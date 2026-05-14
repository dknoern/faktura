import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/apiAuth";
import { tenantContextStorage } from "@/lib/auth-utils";
import { parseListParams, withApiAuth } from "@/lib/v1-route-helpers";
import { fetchRepairs } from "@/lib/data";
import { createRepair } from "@/lib/actions/repair-actions";

function toFormData(obj: Record<string, any>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      fd.append(key, String(value));
    }
  }
  return fd;
}

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if (auth instanceof NextResponse) return auth;

  const { page, limit, search } = parseListParams(request);
  const filter = new URL(request.url).searchParams.get("filter") ?? "all";

  try {
    const result = await tenantContextStorage.run({ tenantId: auth.tenantId }, () =>
      fetchRepairs(page, limit, search, filter)
    );
    return NextResponse.json({ data: result.repairs, total: result.pagination.total, page, limit });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return withApiAuth(request, async () => {
    const body = await request.json();
    const formData = toFormData(body);
    const result = await createRepair(formData);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }
    return NextResponse.json({ success: true }, { status: 201 });
  });
}
