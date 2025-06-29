import { WantedTable } from "@/components/wanted/table";
import { SkeletonTable } from "@/components/skeletons";
import { fetchWanted } from "@/lib/data";
import { Suspense } from "react";

type SearchParams = Promise<{ page: string; search?: string }>;

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const limit = 10;
  const search = params.search || "";
  const { wanted, pagination } = await fetchWanted(page, limit, search);

  return (
    <div>
      <div>
        <Suspense fallback={<SkeletonTable />}>
          <WantedTable wanted={wanted} pagination={pagination} />
        </Suspense>
      </div>
    </div>
  );
}
