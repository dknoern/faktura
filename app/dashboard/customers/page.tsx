import { CustomersTable } from "@/components/customers/table";
export default async function Page() {
  return (
    <div>
      <div>
      <h2 className='text-2xl font-bold tracking-tight'>Customers</h2>
      </div>
      <div>
      <CustomersTable />
      </div>
    </div>
  );
}