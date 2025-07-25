import { LogsTable } from "@/components/logs/table";
import { SkeletonTable } from "@/components/skeletons";
import { fetchLogs } from "@/lib/data";
import { Suspense } from "react";
type SearchParams = Promise<{ page: string, search?: string }>

export default async function Page({ searchParams }: { searchParams: SearchParams }) {

  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const limit = 20;
  const search = params.search || '';

  const { logs, pagination } = await fetchLogs(page, limit, search);

  return (
    <div>

      <div>
        <Suspense fallback={<SkeletonTable />}>
          <LogsTable logs={logs} pagination={pagination} />
        </Suspense>
      </div>
    </div>
  );
}