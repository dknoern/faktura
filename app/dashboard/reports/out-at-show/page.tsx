import { OutAtShowTable } from "@/components/reports/outAtShowTable";
export default async function Page() {
  return (
    <div>
      <div>
      <h2 className='text-2xl font-bold tracking-tight pl-1.5'>Out at Show</h2>
      </div>
      <div>
      <OutAtShowTable />
      </div>
    </div>
  );
}