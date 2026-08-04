import { InvoicesTable } from "@/components/invoices/table";
import { SkeletonTable } from "@/components/skeletons";
import { fetchInvoices, fetchTenant } from "@/lib/data";
import { Suspense } from "react";
import { getPaymentTotalsForInvoices } from "@/lib/actions/payment-actions";

type SearchParams = Promise<{ page: string, search?: string }>

export default async function Page({ searchParams }: { searchParams: SearchParams }) {

  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const limit = 10;
  const search = params.search || '';

  const [{ invoices, pagination }, tenant] = await Promise.all([
    fetchInvoices(page, limit, search),
    fetchTenant(),
  ]);

  const paymentsEnabled = tenant?.features?.payments === true;

  const paymentTotals = paymentsEnabled
    ? await getPaymentTotalsForInvoices(invoices.map((inv: any) => inv._id))
    : {};

  return (
    <div>
      <div>
        <Suspense fallback={<SkeletonTable />}>
          <InvoicesTable
            invoices={invoices}
            pagination={pagination}
            paymentsEnabled={paymentsEnabled}
            paymentTotals={paymentTotals}
          />
        </Suspense>
      </div>
    </div>
  );
}
