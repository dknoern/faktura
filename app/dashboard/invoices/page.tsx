import { InvoicesTable } from "@/components/invoices/table";
import { SkeletonTable } from "@/components/skeletons";
import { Suspense } from "react";
export default async function Page() {
  return (
    <div>
      <div>
        <h2 className='text-2xl font-bold tracking-tight pl-1.5'>Invoices</h2>
      </div>
      <div>
        <Suspense fallback={<SkeletonTable />}>
          <InvoicesTable />
        </Suspense>
      </div>
    </div>
  );
}