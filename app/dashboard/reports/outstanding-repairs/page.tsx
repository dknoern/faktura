import { OutstandingRepairsTable } from "@/components/reports/outstandingRepairsTable";
export default async function Page() {
  return (
    <div>
      <div>
      <h2 className='text-2xl font-bold tracking-tight pl-1.5'>Outstanding Repairs</h2>
      </div>
      <div>
      <OutstandingRepairsTable />
      </div>
    </div>
  );
}