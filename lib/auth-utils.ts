import { headers } from "next/headers";


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

export async function getTenantName() {
  try {
    const headersList = await headers();
    return headersList.get('x-tenant-name') || "lager";
  } catch {
    // Headers not available (likely during build time)
    return "lager";
  }
}
