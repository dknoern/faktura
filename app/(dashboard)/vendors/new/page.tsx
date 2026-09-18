import { VendorForm } from "@/components/vendors/form";
import { fetchTenant } from "@/lib/data";
import { notFound } from 'next/navigation';

export default async function NewVendorPage() {
  const tenant = await fetchTenant();
  if (tenant?.features?.vendors !== true) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">New Vendor</h2>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <VendorForm />
      </div>
    </div>
  );
}
