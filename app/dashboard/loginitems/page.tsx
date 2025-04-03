import { LogsTable } from "@/components/logs/table";
import { SkeletonTable } from "@/components/skeletons";
import { fetchLogs } from "@/lib/data";
import { Suspense } from "react";
export default async function Page({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const limit = 10;
  const { logs, pagination } = await fetchLogs(page, limit);
    
  return (
    <div>
      <div>
        <h2 className='text-2xl font-bold tracking-tight pl-1.5'>Log In Record</h2>
      </div>
      <div>
        <Suspense fallback={<SkeletonTable />}>
          <LogsTable logs={logs} pagination={pagination}/>
        </Suspense>
      </div>
    </div>
  );
}