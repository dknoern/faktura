import { Dashboard } from "@/components/dashboard/dashboard";
import { SkeletonTable } from "@/components/skeletons";
import { getDashboardStats, getMonthlySalesData, getRecentTransactions } from "@/lib/dashboard-actions";
import { Suspense } from "react";

export default async function Page() {
  // Fetch all dashboard data in parallel
  const [stats, salesData, transactions] = await Promise.all([
    getDashboardStats(),
    getMonthlySalesData(),
    getRecentTransactions()
  ]);

  return (
    <div>
      <div>
        <Suspense fallback={<SkeletonTable />}>
          <Dashboard 
            stats={stats}
            salesData={salesData}
            transactions={transactions}
          />
        </Suspense>
      </div>
    </div>
  );
}