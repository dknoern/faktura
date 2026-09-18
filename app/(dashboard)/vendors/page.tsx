import { VendorsTable } from "@/components/vendors/table";
import { SkeletonTable } from "@/components/skeletons";
import { Suspense } from "react";
import { notFound } from 'next/navigation';

import { fetchVendors, fetchTenant } from "@/lib/data";

type SearchParams = Promise<{ page: string, search?: string }>

export default async function Page({ searchParams }: { searchParams: SearchParams }) {

  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const search = params.search || '';
  const limit = 10;

  const tenant = await fetchTenant();
  if (tenant?.features?.vendors !== true) {
    notFound();
  }

  const { vendors, pagination } = await fetchVendors(page, limit, search);
  return (
    <div>
      <div>
        <Suspense fallback={<SkeletonTable />}>
          <VendorsTable vendors={vendors} pagination={pagination} />
        </Suspense>
      </div>
    </div>
  );
}
