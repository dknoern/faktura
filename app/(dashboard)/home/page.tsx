import { Dashboard } from "@/components/dashboard/dashboard";
import { SkeletonTable } from "@/components/skeletons";
import { getDashboardStats, getMonthlySalesData, getRecentTransactions, getInventoryByProductType, getInventoryByStatus } from "@/lib/actions/dashboard-actions";
import { Suspense } from "react";
import { auth } from "@/auth";
import { fetchTenant } from "@/lib/data";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Clock, Receipt, List } from "lucide-react";

// Force dynamic rendering since we fetch dashboard data
export const dynamic = 'force-dynamic';

export default async function Page() {
  // Vendor users get a blank home page until the vendor portal ships
  const session = await auth();
  const user = session?.user as any;
  if (user?.role === 'vendor' || user?.userType === 'vendor') {
    const tenant = await fetchTenant();
    const timeEnabled = tenant?.features?.time === true;
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-2xl font-bold tracking-tight">
          Welcome{user?.name ? `, ${user.name}` : ''}
        </h2>
        {timeEnabled ? (
          <>
            <p className="text-muted-foreground mt-2">
              Track your hours and expenses and submit them for approval.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href="/time/new">
                  <Clock className="mr-2 h-4 w-4" />
                  Enter Time
                </Link>
              </Button>
              <Button asChild>
                <Link href="/time/expense/new">
                  <Receipt className="mr-2 h-4 w-4" />
                  Enter Expense
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/time">
                  <List className="mr-2 h-4 w-4" />
                  View Entries
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground mt-2">
            Your vendor portal is coming soon.
          </p>
        )}
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