import { CustomersTable } from "@/components/customers/table";
import { SkeletonTable } from "@/components/skeletons";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function Page() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className='text-2xl font-bold tracking-tight'>Customers</h2>
        <Link
          href="/dashboard/customers/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="w-4 h-4" />
          New Customer
        </Link>
      </div>
      <div>
        <Suspense fallback={<SkeletonTable />}>
          <CustomersTable />
        </Suspense>
      </div>
    </div>
  );
}