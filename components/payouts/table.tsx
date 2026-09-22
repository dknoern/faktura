"use client"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { vendorPaymentSchema } from "@/lib/models/vendor-payment";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface PaginationProps {
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
}

type VendorPayment = z.infer<typeof vendorPaymentSchema>;

interface PayoutsTableProps {
    payments: VendorPayment[]
    pagination: PaginationProps
    // Hidden when embedded on a vendor's page
    showVendor?: boolean
    // Distinct param name so pagination can coexist with other tables on a page
    pageParam?: string
}

const METHOD_LABELS: Record<string, string> = {
    check: 'Check',
    venmo: 'Venmo',
    other: 'Other',
};

export function PayoutsTable({ payments, pagination, showVendor = true, pageParam = 'page' }: PayoutsTableProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const paymentsList = Array.isArray(payments) ? payments : [];

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set(pageParam, newPage.toString());
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleRowClick = (payment: VendorPayment, e: React.MouseEvent) => {
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) {
            return;
        }
        const target = e.target as HTMLElement;
        if (target.tagName === 'TD' || target.closest('td')) {
            router.push(`/payouts/${payment._id}/view`);
        }
    };

    return (
        <div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Number</TableHead>
                        <TableHead>Date</TableHead>
                        {showVendor && <TableHead>Vendor</TableHead>}
                        <TableHead>Method</TableHead>
                        <TableHead className="text-right">Hours</TableHead>
                        <TableHead className="text-right">Expenses</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Paid By</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paymentsList.map((payment: VendorPayment) => (
                        <TableRow
                            key={payment._id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={(e) => handleRowClick(payment, e)}
                            style={{ userSelect: 'text' }}
                        >
                            <TableCell>{payment.payoutNumber}</TableCell>
                            <TableCell>
                                {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : ''}
                            </TableCell>
                            {showVendor && <TableCell>{payment.vendorName}</TableCell>}
                            <TableCell>
                                <Badge variant="secondary">
                                    {METHOD_LABELS[payment.method] ?? payment.method}
                                    {payment.checkNumber ? ` #${payment.checkNumber}` : ''}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                {payment.timeHours != null ? payment.timeHours.toFixed(1) : ''}
                            </TableCell>
                            <TableCell className="text-right">
                                {payment.expenseAmount != null ? `$${payment.expenseAmount.toFixed(2)}` : ''}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                                ${payment.totalAmount.toFixed(2)}
                            </TableCell>
                            <TableCell>{payment.paidBy}</TableCell>
                        </TableRow>
                    ))}
                    {paymentsList.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={showVendor ? 8 : 7} className="text-center text-muted-foreground py-8">
                                No payouts yet
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                    Showing {paymentsList.length} of {pagination.total} payouts
                </div>
                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage <= 1}
                    >
                        Previous
                    </Button>
                    <div className="flex items-center">
                        <span className="px-2">Page {pagination.currentPage} of {Math.max(pagination.pages, 1)}</span>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage >= pagination.pages}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    )
}
