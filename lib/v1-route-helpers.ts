import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/apiAuth";
import { tenantContextStorage } from "@/lib/auth-utils";
import { isValidObjectId } from "@/lib/api-key-utils";

export { isValidObjectId };

/**
 * Authenticate the API key, set tenant context, and run handler.
 * All action functions called inside handler will pick up the correct tenantId.
 */
export async function withApiAuth(
  request: NextRequest,
  handler: (tenantId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  const auth = await authenticateApiKey(request);
  if (auth instanceof NextResponse) return auth;

  try {
    return await tenantContextStorage.run({ tenantId: auth.tenantId }, () =>
      handler(auth.tenantId)
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Internal server error" }, { status: 500 });
  }
}

export function parseListParams(request: NextRequest): {
  page: number;
  limit: number;
  search: string;
} {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));
  const search = searchParams.get("search") ?? "";
  return { page, limit, search };
}

export async function handleListRoute(
  request: NextRequest,
  fetchFn: (page: number, limit: number, search: string) => Promise<{ data: unknown[]; pagination: { total: number } }>
): Promise<NextResponse> {
  const auth = await authenticateApiKey(request);
  if (auth instanceof NextResponse) return auth;

  const { page, limit, search } = parseListParams(request);

  try {
    const result = await tenantContextStorage.run({ tenantId: auth.tenantId }, () =>
      fetchFn(page, limit, search)
    );
    return NextResponse.json({ data: result.data, total: result.pagination.total, page, limit });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function handleItemRoute(
  request: NextRequest,
  id: string,
  fetchFn: (id: string) => Promise<unknown>
): Promise<NextResponse> {
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const auth = await authenticateApiKey(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const item = await tenantContextStorage.run({ tenantId: auth.tenantId }, () => fetchFn(id));
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
