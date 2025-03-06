import { RepairsTable } from "@/components/repairs/table";
export default async function Page() {
  return (
    <div>
      <div>
      <h2 className='text-2xl font-bold tracking-tight'>Repairs</h2>
      </div>
      <div>
      <RepairsTable />
      </div>
    </div>
  );
}