import { RepairsTable } from "@/components/repairs/table";
import { SkeletonTable } from "@/components/skeletons";
import { fetchRepairs } from "@/lib/data";
import { Suspense } from "react";

type SearchParams = Promise<{ page: string; search?: string; filter?: string }>;

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const limit = 10;
  const search = params.search || "";
  const filter = params.filter || "outstanding";
  const { repairs, pagination } = await fetchRepairs(page, limit, search, filter);

  return (
    <div>
      <div>
        <Suspense fallback={<SkeletonTable />}>
          <RepairsTable repairs={repairs} pagination={pagination} />
        </Suspense>
      </div>
    </div>
  );
}