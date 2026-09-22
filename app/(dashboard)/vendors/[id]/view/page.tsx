import { VendorViewDetails } from "@/components/vendors/vendor-view-details";
import { VendorRecordsTabs } from "@/components/vendors/vendor-records-tabs";
import { TimeTable } from "@/components/time/table";
import { PayoutsTable } from "@/components/payouts/table";
import { SkeletonTable } from "@/components/skeletons";
import { Suspense } from "react";
import { fetchVendorById, fetchTenant, fetchTimeEntries, fetchUnpaidApprovedEntries, fetchVendorPayments } from "@/lib/data";
import type { PayoutSummary } from "@/components/vendors/payout-dialog";
import { notFound } from 'next/navigation';
import { auth } from "@/auth";

const VALID_STATUSES = ['Pending', 'Approved', 'Rejected', 'Paid'];

export default async function ViewVendorPage(props: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ page?: string, status?: string, payoutPage?: string }>,
}) {
    const params = await props.params;
    const id = params.id;
    const search = await props.searchParams;
    const page = search.page ? parseInt(search.page) : 1;
    const payoutPage = search.payoutPage ? parseInt(search.payoutPage) : 1;
    const status = search.status && VALID_STATUSES.includes(search.status) ? search.status : '';

    const [vendor, tenant, session] = await Promise.all([
        fetchVendorById(id),
        fetchTenant(),
        auth(),
    ]);

    if (tenant?.features?.vendors !== true) {
        notFound();
    }
    if (!vendor) {
        notFound();
    }

    const isAdmin = (session?.user as any)?.role === "admin";
    const timeEnabled = tenant?.features?.time === true;

    // Admins see the vendor's time & expense entries and payouts below their details
    const [entryData, payoutData] = isAdmin && timeEnabled
        ? await Promise.all([
            fetchTimeEntries(page, 10, { status, vendorId: vendor._id.toString() }),
            fetchVendorPayments(payoutPage, 10, { vendorId: vendor._id.toString() }),
        ])
        : [null, null];

    // Payout summary: everything approved but not yet paid out
    let payout: PayoutSummary | null = null;
    if (isAdmin && timeEnabled) {
        const unpaid = await fetchUnpaidApprovedEntries(vendor._id.toString());
        const timeEntries = unpaid.filter((e: any) => (e.entryType ?? 'time') === 'time');
        const expenses = unpaid.filter((e: any) => e.entryType === 'expense');
        const timeHours = Math.round(timeEntries.reduce((sum: number, e: any) => sum + (e.hours || 0), 0) * 10) / 10;
        const hourlyRate = typeof vendor.hourlyRate === 'number' && vendor.hourlyRate > 0 ? vendor.hourlyRate : null;
        const timeAmount = hourlyRate ? Math.round(timeHours * hourlyRate * 100) / 100 : 0;
        const expenseAmount = Math.round(expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0) * 100) / 100;
        payout = {
            eligible: unpaid.length > 0,
            timeCount: timeEntries.length,
            expenseCount: expenses.length,
            timeHours,
            hourlyRate,
            timeAmount,
            expenseAmount,
            total: Math.round((timeAmount + expenseAmount) * 100) / 100,
            needsHourlyRate: timeEntries.length > 0 && !hourlyRate,
        };
    }

    return (
        <div className="space-y-6">
            <VendorViewDetails
                vendor={JSON.parse(JSON.stringify(vendor))}
                isAdmin={isAdmin}
                payout={payout}
            />
            {entryData && payoutData && (
                <div className="mt-8">
                    <Suspense fallback={<SkeletonTable />}>
                        <VendorRecordsTabs
                            entriesContent={
                                <TimeTable
                                    entries={entryData.entries}
                                    pagination={entryData.pagination}
                                    isAdmin={isAdmin}
                                    showVendor={false}
                                    showNewEntry={false}
                                />
                            }
                            payoutsContent={
                                <PayoutsTable
                                    payments={payoutData.payments}
                                    pagination={payoutData.pagination}
                                    showVendor={false}
                                    pageParam="payoutPage"
                                />
                            }
                        />
                    </Suspense>
                </div>
            )}
        </div>
    );
}
