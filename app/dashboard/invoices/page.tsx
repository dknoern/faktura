import { InvoicesTable } from "@/components/invoices/table";
import { SkeletonTable } from "@/components/skeletons";
import { fetchInvoices } from "@/lib/data";
import { Suspense } from "react";
export default async function Page() {



  const invoices: any[] = await fetchInvoices();
  
  return (
    <div>
      <div>
        <h2 className='text-2xl font-bold tracking-tight pl-1.5'>Invoices</h2>
      </div>
      <div>
        <Suspense fallback={<SkeletonTable />}>
          <InvoicesTable invoices={invoices} />
        </Suspense>
      </div>
    </div>
  );
}