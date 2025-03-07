import { ReturnsSummaryTable } from "@/components/reports/returnsSummaryTable";
export default async function Page() {
  return (
    <div>
      <div>
      <h2 className='text-2xl font-bold tracking-tight pl-1.5'>Returns Summary</h2>
      </div>
      <div>
      <ReturnsSummaryTable />
      </div>
    </div>
  );
}