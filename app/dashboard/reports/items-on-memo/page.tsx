import { ItemsOnMemoTable } from "@/components/reports/itemsOnMemoTable";
export default async function Page() {
  return (
    <div>
      <div>
      <h2 className='text-2xl font-bold tracking-tight pl-1.5'>Items on Memo</h2>
      </div>
      <div>
      <ItemsOnMemoTable />
      </div>
    </div>
  );
}