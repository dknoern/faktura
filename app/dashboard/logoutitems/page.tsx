import { OutsTable } from "@/components/outs/table";
import { SkeletonTable } from "@/components/skeletons";
import { fetchOuts } from "@/lib/data";
import { Suspense } from "react";
type SearchParams = Promise<{page: string}>

export default async function Page({searchParams}: {searchParams:SearchParams}) {

  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const limit = 10;

  const { outs, pagination } = await fetchOuts(page, limit);

  return (
    <div>
      <div>
        <h2 className='text-2xl font-bold tracking-tight pl-1.5'>Log Out Items</h2>
      </div>
      <div>
        <Suspense fallback={<SkeletonTable />}>
          <OutsTable outs={outs} pagination={pagination}/>
        </Suspense>
      </div>
    </div>
  );
}