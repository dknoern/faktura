import { ReturnsTable } from "@/components/returns/table";
import { SkeletonTable } from "@/components/skeletons";
import { fetchReturns } from "@/lib/data";
import { Suspense } from "react";
type SearchParams = Promise<{ page: string, search?: string }>

export default async function Page({ searchParams }: { searchParams: SearchParams }) {

  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const limit = 10;
  const search = params.search || '';

  const { returns, pagination } = await fetchReturns(page, limit, search);
  return (
    <div>
      <div>
        <Suspense fallback={<SkeletonTable />}>
          <ReturnsTable returns={returns} pagination={pagination} />
        </Suspense>
      </div>
    </div>
  );
}