import { PayoutsTable } from "@/components/payouts/table";
import { SkeletonTable } from "@/components/skeletons";
import { Suspense } from "react";
import { notFound } from 'next/navigation';

import { fetchVendorPayments, fetchTenant } from "@/lib/data";

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ page?: string }>

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const limit = 20;

  const tenant = await fetchTenant();
  if (tenant?.features?.time !== true) {
    notFound();
  }

  const { payments, pagination } = await fetchVendorPayments(page, limit);

  return (
    <div>
      <div>
        <Suspense fallback={<SkeletonTable />}>
          <PayoutsTable payments={payments} pagination={pagination} />
        </Suspense>
      </div>
    </div>
  );
}
