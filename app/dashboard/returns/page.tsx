import { ReturnsTable } from "@/components/returns/table";
export default async function Page() {
  return (
    <div>
      <div>
      <h2 className='text-2xl font-bold tracking-tight'>Returns</h2>
      </div>
      <div>
      <ReturnsTable />
      </div>
    </div>
  );
}