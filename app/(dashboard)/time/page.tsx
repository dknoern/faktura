import { TimeTable } from "@/components/time/table";
import { SkeletonTable } from "@/components/skeletons";
import { Suspense } from "react";
import { notFound } from 'next/navigation';
import { auth } from "@/auth";

import { fetchTimeEntries, fetchTenant, fetchVendorByEmail } from "@/lib/data";

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ page?: string, status?: string }>

const VALID_STATUSES = ['Pending', 'Approved', 'Rejected'];

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const status = params.status && VALID_STATUSES.includes(params.status) ? params.status : '';
  const limit = 20;

  const [tenant, session] = await Promise.all([fetchTenant(), auth()]);
  if (tenant?.features?.time !== true) {
    notFound();
  }

  const user = session?.user as any;
  const isAdmin = user?.role === 'admin';
  const isVendor = user?.role === 'vendor' || user?.userType === 'vendor';

  // Vendors only ever see their own entries
  let vendorId = '';
  if (isVendor) {
    const vendor = user?.email ? await fetchVendorByEmail(user.email) : null;
    if (!vendor) {
      return (
        <div className="py-12 text-center text-muted-foreground">
          No vendor profile is linked to your account. Please contact your administrator.
        </div>
      );
    }
    vendorId = vendor._id.toString();
  }

  const { entries, pagination } = await fetchTimeEntries(page, limit, { status, vendorId });

  return (
    <div>
      <div>
        <Suspense fallback={<SkeletonTable />}>
          <TimeTable
            entries={entries}
            pagination={pagination}
            isAdmin={isAdmin}
            showVendor={!isVendor}
          />
        </Suspense>
      </div>
    </div>
  );
}
