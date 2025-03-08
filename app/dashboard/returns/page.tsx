import { ReturnsTable } from "@/components/returns/table";
import { SkeletonTable } from "@/components/skeletons";
import { Suspense } from "react";
export default async function Page() {
  return (
    <div>
      <div className="pl-1.5">
        <h2 className='text-2xl font-bold tracking-tight pl-1.5'>Returns</h2>
      </div>
      <div>
        <Suspense fallback={<SkeletonTable />}>
          <ReturnsTable />
        </Suspense>
      </div>
    </div>
  );
}