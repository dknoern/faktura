import { ReturnsTable } from "@/components/returns/table";
export default async function Page() {
  return (
    <div>
      <div className="pl-1.5">
      <h2 className='text-2xl font-bold tracking-tight pl-1.5'>Returns</h2>
      </div>
      <div>
      <ReturnsTable />
      </div>
    </div>
  );
}