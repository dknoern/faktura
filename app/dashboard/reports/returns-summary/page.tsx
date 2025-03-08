import { ReturnsSummaryTable } from "@/components/reports/returnsSummaryTable";
import { SkeletonTable } from "@/components/skeletons";
import { Suspense } from "react";
export default async function Page() {
  return (
    <div>
      <div>
        <h2 className='text-2xl font-bold tracking-tight pl-1.5'>Returns Summary</h2>
      </div>
      <div>
        <Suspense fallback={<SkeletonTable />}>
          <ReturnsSummaryTable />
        </Suspense>
      </div>
    </div>
  );
}