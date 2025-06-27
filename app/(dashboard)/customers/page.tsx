import { CustomersTable } from "@/components/customers/table";
import { SkeletonTable } from "@/components/skeletons";
import { Suspense } from "react";

import { fetchCustomers } from "@/lib/data";

type SearchParams = Promise<{ page: string, search?: string }>

export default async function Page({ searchParams }: { searchParams: SearchParams }) {

  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const search = params.search || '';
  const limit = 10;

  const { customers, pagination } = await fetchCustomers(page, limit, search);
  return (
    <div>

      <div>
        <Suspense fallback={<SkeletonTable />}>
          <CustomersTable customers={customers} pagination={pagination} />
        </Suspense>
      </div>
    </div>
  );
}