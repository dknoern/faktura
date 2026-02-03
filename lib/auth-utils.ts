import { headers } from "next/headers";
import mongoose from "mongoose";

const defaultTenantId = "67f48a2050abe41246b22a87"
const defaultTenantName = "lager"

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
  try {
    const headersList = await headers();
    const tenantIdString = headersList.get('x-tenant-id') || defaultTenantId;
    return new mongoose.Types.ObjectId(tenantIdString);
  } catch {
    // Headers not available (likely during build time)
    return new mongoose.Types.ObjectId(defaultTenantId);
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
