import { CustomersTable } from "@/components/customers/table";
import { SkeletonTable } from "@/components/skeletons";
import { Suspense } from "react";
import { PlusCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

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
      <div className="flex items-center justify-between mb-6">
        <h2 className='text-2xl font-bold tracking-tight'>Customers</h2>
        <Link
          href="/customers/new"
          className={buttonVariants({ variant: "default" })}
        >
          <PlusCircle className="w-4 h-4" />
          New Customer
        </Link>
      </div>
      <div>
        <Suspense fallback={<SkeletonTable />}>
          <CustomersTable customers={customers} pagination={pagination} />
        </Suspense>
      </div>
    </div>
  );
}