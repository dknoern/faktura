import { OutsTable } from "@/components/outs/table";
import { SkeletonTable } from "@/components/skeletons";
import { Suspense } from "react";
export default async function Page() {
  return (
    <div>
      <div>
        <h2 className='text-2xl font-bold tracking-tight pl-1.5'>Log Out Items</h2>
      </div>
      <div>
        <Suspense fallback={<SkeletonTable />}>
          <OutsTable />
        </Suspense>
      </div>
    </div>
  );
}