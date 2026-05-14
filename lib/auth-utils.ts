import { AsyncLocalStorage } from "async_hooks";
import { headers } from "next/headers";

const defaultTenantId = "67f48a2050abe41246b22a87"
const defaultTenantName = "lager"

// Allows API routes to set tenant context without mutating incoming headers
export const tenantContextStorage = new AsyncLocalStorage<{ tenantId: string }>();

export async function getShortUser() {
  try {
    const headersList = await headers();
    return headersList.get('x-user-short') || "System";
  } catch {
    // Headers not available (likely during build time)
    return "System";
  }
}

export async function getFullName() {
  try {
    const headersList = await headers();
    return headersList.get('x-full-name') || getShortUser();
  } catch {
    // Headers not available (likely during build time)
    return getShortUser();
  }
}

export async function getTenantId() {
  const ctx = tenantContextStorage.getStore();
  if (ctx?.tenantId) return ctx.tenantId;
  try {
    const headersList = await headers();
    return headersList.get('x-tenant-id') || defaultTenantId;
  } catch {
    // Headers not available (likely during build time)
    return defaultTenantId;
  }
}

export async function getTenantName() {
  try {
    const headersList = await headers();
    return headersList.get('x-tenant-name') || defaultTenantName;
  } catch {
    // Headers not available (likely during build time)
    return defaultTenantName;
  }
}

