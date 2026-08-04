"use server";

import dbConnect from "@/lib/dbConnect";
import { Tenant } from "@/lib/models/tenant";
import { getTenantObjectId } from "@/lib/tenant-utils";
import { auth } from "@/auth";

export interface TenantFeaturesView {
  proposals: boolean;
  returns: boolean;
  repairs: boolean;
  wanted: boolean;
  loginitems: boolean;
  logoutitems: boolean;
  reports: boolean;
  payments: boolean;
}

async function requireAdmin(): Promise<void> {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "admin") throw new Error("Forbidden: admin access required");
}

export async function getTenantFeaturesSettings(): Promise<TenantFeaturesView> {
  await requireAdmin();
  await dbConnect();
  const tenantObjectId = await getTenantObjectId();

  const tenant = await Tenant.findOne({ _id: tenantObjectId })
    .select({ features: 1 })
    .lean();

  const f = (tenant as any)?.features ?? {};
  return {
    proposals: f.proposals ?? false,
    returns: f.returns ?? false,
    repairs: f.repairs ?? false,
    wanted: f.wanted ?? false,
    loginitems: f.loginitems ?? false,
    logoutitems: f.logoutitems ?? false,
    reports: f.reports ?? false,
    payments: f.payments ?? false,
  };
}

export async function updateTenantFeaturesSettings(
  settings: TenantFeaturesView
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  await dbConnect();
  const tenantObjectId = await getTenantObjectId();

  await Tenant.updateOne(
    { _id: tenantObjectId },
    {
      $set: {
        "features.proposals": settings.proposals,
        "features.returns": settings.returns,
        "features.repairs": settings.repairs,
        "features.wanted": settings.wanted,
        "features.loginitems": settings.loginitems,
        "features.logoutitems": settings.logoutitems,
        "features.reports": settings.reports,
        "features.payments": settings.payments,
      },
    }
  );

  return { success: true };
}
