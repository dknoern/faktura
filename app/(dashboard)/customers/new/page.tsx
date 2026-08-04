import { CustomerForm } from "@/components/customers/form";
import { getTenantId } from "@/lib/auth-utils";
import { loadTenantRequiredData } from "@/lib/tenant-required-data";

export default async function NewCustomerPage() {
  const tenantId = await getTenantId();
  const requiredData = await loadTenantRequiredData(tenantId);

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">New Customer</h2>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <CustomerForm
          customer={{
            _id: 0,
            firstName: "",
            lastName: "",
            lastUpdated: new Date(),
          }}
          requiredData={requiredData}
        />
      </div>
    </div>
  );
}
