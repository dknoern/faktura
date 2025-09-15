import { RepairsTable } from "@/components/repairs/table";
import { RepairBoardWrapper } from "@/components/repairs/repair-board-wrapper";
import { SkeletonTable } from "@/components/skeletons";
import { fetchRepairs } from "@/lib/data";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Table } from "lucide-react";

type SearchParams = Promise<{ page: string; search?: string; filter?: string; view?: string }>;

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = params.view === 'board' ? 1 : (params.page ? parseInt(params.page) : 1);
  const limit = params.view === 'board' ? 1000 : 10; // Load more repairs for board view
  const search = params.search || "";
  const filter = params.filter || "outstanding";
  const view = params.view || "table";
  const { repairs, pagination } = await fetchRepairs(page, limit, search, filter);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Repairs</h1>
        <div className="flex gap-2">
          <Button
            variant={view === 'table' ? 'default' : 'outline'}
            size="sm"
            asChild
          >
            <a href={`/repairs?${new URLSearchParams({ ...params, view: 'table' }).toString()}`}>
              <Table className="h-4 w-4 mr-2" />
              Table
            </a>
          </Button>
          <Button
            variant={view === 'board' ? 'default' : 'outline'}
            size="sm"
            asChild
          >
            <a href={`/repairs?${new URLSearchParams({ ...params, view: 'board' }).toString()}`}>
              <LayoutGrid className="h-4 w-4 mr-2" />
              Board
            </a>
          </Button>
        </div>
      </div>
      
      <div className="flex-1">
        <Suspense fallback={<SkeletonTable />}>
          {view === 'board' ? (
            <RepairBoardWrapper repairs={repairs} />
          ) : (
            <RepairsTable repairs={repairs} pagination={pagination} />
          )}
        </Suspense>
      </div>
    </div>
  );
}