import { LogsTable } from "@/components/logs/table";
import { SkeletonTable } from "@/components/skeletons";
import { fetchLogs } from "@/lib/data";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
type SearchParams = Promise<{ page: string, search?: string }>

export default async function Page({ searchParams }: { searchParams: SearchParams }) {

  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const limit = 10;
  const search = params.search || '';

  const { logs, pagination } = await fetchLogs(page, limit, search);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className='text-2xl font-bold tracking-tight pl-1.5'>Log In Items</h2>
        <Link href="/dashboard/loginitems/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Item
          </Button>
        </Link>
      </div>
      <div>
        <Suspense fallback={<SkeletonTable />}>
          <LogsTable logs={logs} pagination={pagination} />
        </Suspense>
      </div>
    </div>
  );
}