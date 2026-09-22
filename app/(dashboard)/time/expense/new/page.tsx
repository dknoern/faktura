import { ExpenseForm } from "@/components/time/expense-form";
import { fetchProjectOptions, fetchTenant, fetchVendorOptions } from "@/lib/data";
import { notFound } from 'next/navigation';
import { auth } from "@/auth";

export const dynamic = 'force-dynamic';

export default async function NewExpenseEntryPage() {
  const [tenant, session] = await Promise.all([fetchTenant(), auth()]);
  if (tenant?.features?.time !== true) {
    notFound();
  }

  const user = session?.user as any;
  const isAdmin = user?.role === 'admin';

  const [projects, vendors] = await Promise.all([
    fetchProjectOptions(),
    isAdmin ? fetchVendorOptions() : Promise.resolve([]),
  ]);

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Enter Expense</h2>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <ExpenseForm projects={projects} vendors={vendors} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
