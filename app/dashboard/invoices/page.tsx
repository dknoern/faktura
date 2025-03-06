import { InvoicesTable } from "@/components/invoices/table";
export default async function Page() {
  return (
    <div>
      <div>
      <h2 className='text-2xl font-bold tracking-tight pl-1.5'>Invoices</h2>
      </div>
      <div>
      <InvoicesTable />
      </div>
    </div>
  );
}