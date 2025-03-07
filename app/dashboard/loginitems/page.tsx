import { LogsTable } from "@/components/logs/table";
export default async function Page() {
  return (
    <div>
      <div>
      <h2 className='text-2xl font-bold tracking-tight pl-1.5'>Log In Record</h2>
      </div>
      <div>
      <LogsTable />
      </div>
    </div>
  );
}