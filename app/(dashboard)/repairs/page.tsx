import { RepairsTable } from "@/components/repairs/table";

import { SkeletonTable } from "@/components/skeletons";
import { fetchRepairs } from "@/lib/data";
import { Suspense } from "react";

type SearchParams = Promise<{ page: string; search?: string; filter?: string; view?: string }>;

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const limit = 10;
  const search = params.search || "";
  const filter = params.filter || "outstanding";
  const { repairs, pagination } = await fetchRepairs(page, limit, search, filter);
  

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Repairs</h1>
      </div>
      
      <div className="flex-1">
        <Suspense fallback={<SkeletonTable />}>
          <RepairsTable repairs={repairs} pagination={pagination} />
        </Suspense>
      </div>
    </div>
  );
}