import { ReturnsTable } from "@/components/returns/table";
import { SkeletonTable } from "@/components/skeletons";
import { fetchReturns } from "@/lib/data";
import { Suspense } from "react";
export default async function Page({searchParams}: {searchParams: {page: string}}) {

  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const limit = 10;

  const { returns, pagination } = await fetchReturns(page, limit);
  return (
    <div>
      <div className="pl-1.5">
        <h2 className='text-2xl font-bold tracking-tight pl-1.5'>Returns</h2>
      </div>
      <div>
        <Suspense fallback={<SkeletonTable />}>
          <ReturnsTable returns={returns} pagination={pagination} />
        </Suspense>
      </div>
    </div>
  );
}