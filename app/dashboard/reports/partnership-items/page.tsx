import { ItemsBySellerTypeTable } from "@/components/reports/itemsBySellerTypeTable";
import { SkeletonTable } from "@/components/skeletons";
import { Suspense } from "react";
export default async function Page() {
  return (
    <div>
      <div>
        <h2 className='text-2xl font-bold tracking-tight pl-1.5'>Partnership Items</h2>
      </div>
      <div>
        <Suspense fallback={<SkeletonTable />}>
          <ItemsBySellerTypeTable sellerType={'Partner'} />
        </Suspense>
      </div>
    </div>
  );
}