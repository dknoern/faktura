import { ShowReportTable } from "@/components/reports/showReportTable";
export default async function Page() {
  return (
    <div>
      <div>
      <h2 className='text-2xl font-bold tracking-tight pl-1.5'>Show Report</h2>
      </div>
      <div>
      <ShowReportTable />
      </div>
    </div>
  );
}