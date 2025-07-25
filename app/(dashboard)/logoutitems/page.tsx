import { OutsTable } from "@/components/outs/table";
import { SkeletonTable } from "@/components/skeletons";
import { fetchOuts } from "@/lib/data";
import { Suspense } from "react";
type SearchParams = Promise<{ page: string, search?: string }>

export default async function Page({ searchParams }: { searchParams: SearchParams }) {

  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const limit = 20;
  const search = params.search || '';

  const { outs, pagination } = await fetchOuts(page, limit, search);

  return (
    <div>
        <Suspense fallback={<SkeletonTable />}>
          <OutsTable outs={outs} pagination={pagination} />
        </Suspense>
    </div>
  );
}