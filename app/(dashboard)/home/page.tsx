import { Dashboard } from "@/components/dashboard/dashboard";
import { SkeletonTable } from "@/components/skeletons";
import { getDashboardStats, getMonthlySalesData, getRecentTransactions, getInventoryByProductType, getInventoryByStatus } from "@/lib/actions/dashboard-actions";
import { Suspense } from "react";
import { auth } from "@/auth";

// Force dynamic rendering since we fetch dashboard data
export const dynamic = 'force-dynamic';

export default async function Page() {
  // Vendor users get a blank home page until the vendor portal ships
  const session = await auth();
  const user = session?.user as any;
  if (user?.role === 'vendor' || user?.userType === 'vendor') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-2xl font-bold tracking-tight">
          Welcome{user?.name ? `, ${user.name}` : ''}
        </h2>
        <p className="text-muted-foreground mt-2">
          Your vendor portal is coming soon.
        </p>
      </div>
    );
  }

  // Fetch all dashboard data in parallel
  const [stats, salesData, transactions, productTypeData, statusData] = await Promise.all([
    getDashboardStats(),
    getMonthlySalesData(),
    getRecentTransactions(),
    getInventoryByProductType(),
    getInventoryByStatus()
  ]);

  return (
    <div>
      <div>
        <Suspense fallback={<SkeletonTable />}>
          <Dashboard 
            stats={stats}
            salesData={salesData}
            transactions={transactions}
            productTypeData={productTypeData}
            statusData={statusData}
          />
        </Suspense>
      </div>
    </div>
  );
}