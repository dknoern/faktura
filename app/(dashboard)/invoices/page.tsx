import { InvoicesTable } from "@/components/invoices/table";
import { SkeletonTable } from "@/components/skeletons";
import { fetchInvoices } from "@/lib/data";
import { Suspense } from "react";

type SearchParams = Promise<{ page: string, search?: string }>

export default async function Page({ searchParams }: { searchParams: SearchParams }) {

  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const limit = 10;
  const search = params.search || '';

  const { invoices, pagination } = await fetchInvoices(page, limit, search);

  return (
    <div>
      <div>
        <Suspense fallback={<SkeletonTable />}>
          <InvoicesTable invoices={invoices} pagination={pagination} />
        </Suspense>
      </div>
    </div>
  );
}