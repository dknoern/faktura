import { CustomersTable } from "@/components/customers/table";
import { SkeletonTable } from "@/components/skeletons";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link";

export default async function Page() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className='text-2xl font-bold tracking-tight'>Customers</h2>
        <Link
          href="/dashboard/customers/new"
          className={buttonVariants({ variant: "default" })}
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