import { DailySalesTable } from "@/components/reports/dailySalesTable";
export default async function Page() {
  return (
    <div>
      <div>
      <h2 className='text-2xl font-bold tracking-tight pl-1.5'>Daily Sales</h2>
      </div>
      <div>
      <DailySalesTable />
      </div>
    </div>
  );
}