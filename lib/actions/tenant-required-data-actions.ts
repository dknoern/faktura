'use server'

import dbConnect from "@/lib/dbConnect";
import { Tenant } from "@/lib/models/tenant";
import { getTenantObjectId } from "@/lib/tenant-utils";
import { auth } from "@/auth";

export interface RequiredDataSettingsView {
  customerPhone: boolean;
  customerEmail: boolean;
  customerAddress: boolean;
  salesPerson: boolean;
}

async function requireAdmin(): Promise<void> {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== 'admin') {
    throw new Error('Forbidden: admin access required');
  }
}

export async function getTenantRequiredDataSettings(): Promise<RequiredDataSettingsView> {
  await requireAdmin();
  await dbConnect();
  const tenantObjectId = await getTenantObjectId();

  const tenant = await Tenant.findOne({ _id: tenantObjectId })
    .select({
      'requiredData.customerPhone': 1,
      'requiredData.customerEmail': 1,
      'requiredData.customerAddress': 1,
      'requiredData.salesPerson': 1,
    })
    .lean();

  const rd = (tenant as any)?.requiredData;
  return {
    customerPhone: rd?.customerPhone ?? true,
    customerEmail: rd?.customerEmail ?? true,
    customerAddress: rd?.customerAddress ?? true,
    salesPerson: rd?.salesPerson ?? true,
  };
}

export async function updateTenantRequiredDataSettings(
  settings: RequiredDataSettingsView
): Promise<{ success: boolean; error?: string; settings?: RequiredDataSettingsView }> {
  await requireAdmin();
  await dbConnect();
  const tenantObjectId = await getTenantObjectId();

  await Tenant.updateOne(
    { _id: tenantObjectId },
    {
      $set: {
        'requiredData.customerPhone': settings.customerPhone,
        'requiredData.customerEmail': settings.customerEmail,
        'requiredData.customerAddress': settings.customerAddress,
        'requiredData.salesPerson': settings.salesPerson,
      },
    }
  );

  return { success: true, settings };
}
