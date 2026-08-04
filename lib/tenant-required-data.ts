import dbConnect from "@/lib/dbConnect";
import { Tenant } from "@/lib/models/tenant";

export interface TenantRequiredData {
  customerPhone: boolean;
  customerEmail: boolean;
  customerAddress: boolean;
  salesPerson: boolean;
}

const DEFAULTS: TenantRequiredData = {
  customerPhone: true,
  customerEmail: true,
  customerAddress: true,
  salesPerson: true,
};

export async function loadTenantRequiredData(tenantId: string): Promise<TenantRequiredData> {
  await dbConnect();

  const tenant = await Tenant.findById(tenantId)
    .select({
      "requiredData.customerPhone": 1,
      "requiredData.customerEmail": 1,
      "requiredData.customerAddress": 1,
      "requiredData.salesPerson": 1,
    })
    .lean();

  const rd = (tenant as any)?.requiredData;
  if (!rd) return DEFAULTS;

  return {
    customerPhone: rd.customerPhone ?? true,
    customerEmail: rd.customerEmail ?? true,
    customerAddress: rd.customerAddress ?? true,
    salesPerson: rd.salesPerson ?? true,
  };
}
