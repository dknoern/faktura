import { InStockTable } from "@/components/reports/inStockTable";
export default async function Page() {
  return (
    <div>
      <div>
      <h2 className='text-2xl font-bold tracking-tight pl-1.5'>In Stock</h2>
      </div>
      <div>
      <InStockTable />
      </div>
    </div>
  );
}