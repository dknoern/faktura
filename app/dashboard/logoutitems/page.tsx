import { OutsTable } from "@/components/outs/table";
export default async function Page() {
  return (
    <div>
      <div>
      <h2 className='text-2xl font-bold tracking-tight pl-1.5'>Log Out Items</h2>
      </div>
      <div>
      <OutsTable />
      </div>
    </div>
  );
}