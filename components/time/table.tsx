"use client"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { timeEntrySchema } from "@/lib/models/time";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { PlusCircle, Check, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { approveTimeEntry, rejectTimeEntry } from "@/lib/actions/time-actions";

interface PaginationProps {
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
}

type TimeEntry = z.infer<typeof timeEntrySchema>;

interface TimeTableProps {
    entries: TimeEntry[]
    pagination: PaginationProps
    isAdmin?: boolean
    // Vendor column is redundant on a vendor's own list
    showVendor?: boolean
}

function statusBadgeVariant(status?: string): "default" | "secondary" | "outline" | "destructive" {
    if (status === 'Approved') return 'default';
    if (status === 'Rejected') return 'destructive';
    return 'outline';
}

export function TimeTable({ entries, pagination, isAdmin = false, showVendor = true }: TimeTableProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [reviewingId, setReviewingId] = useState<string | null>(null);

    const entriesList = Array.isArray(entries) ? entries : [];
    const statusFilter = searchParams.get('status') || 'all';

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', newPage.toString());
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleStatusFilter = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === 'all') {
            params.delete('status');
        } else {
            params.set('status', value);
        }
        params.set('page', '1');
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleReview = async (entry: TimeEntry, action: 'approve' | 'reject') => {
        const id = entry._id.toString();
        setReviewingId(id);
        try {
            const result = action === 'approve'
                ? await approveTimeEntry(id)
                : await rejectTimeEntry(id);
            if (result.success) {
                toast.success(action === 'approve' ? "Time entry approved" : "Time entry rejected");
                router.refresh();
            } else {
                toast.error(result.error ?? `Failed to ${action} time entry`);
            }
        } finally {
            setReviewingId(null);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4 space-x-2">
                <div className="w-[180px]">
                    <Select value={statusFilter} onValueChange={handleStatusFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Approved">Approved</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button
                    variant="outline"
                    onClick={() => router.push('/time/new')}
                    className="ml-4 flex items-center gap-1"
                >
                    <PlusCircle size={18} />
                    <span>Enter Time</span>
                </Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        {showVendor && <TableHead>Vendor</TableHead>}
                        <TableHead>Project</TableHead>
                        <TableHead className="text-right">Hours</TableHead>
                        <TableHead>Comment</TableHead>
                        <TableHead>Status</TableHead>
                        {isAdmin && <TableHead className="text-center">Review</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {entriesList.map((entry: TimeEntry) => (
                        <TableRow key={entry._id}>
                            <TableCell>{entry.date}</TableCell>
                            {showVendor && <TableCell>{entry.vendorName}</TableCell>}
                            <TableCell>{entry.projectName}</TableCell>
                            <TableCell className="text-right">{entry.hours.toFixed(1)}</TableCell>
                            <TableCell className="max-w-[300px] truncate" title={entry.comment}>
                                {entry.comment}
                            </TableCell>
                            <TableCell>
                                <Badge variant={statusBadgeVariant(entry.status)}>{entry.status}</Badge>
                            </TableCell>
                            {isAdmin && (
                                <TableCell className="text-center">
                                    {entry.status === 'Pending' && (
                                        <div className="flex justify-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={reviewingId === entry._id.toString()}
                                                onClick={() => handleReview(entry, 'approve')}
                                            >
                                                <Check className="h-4 w-4 mr-1" />
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={reviewingId === entry._id.toString()}
                                                onClick={() => handleReview(entry, 'reject')}
                                            >
                                                <X className="h-4 w-4 mr-1" />
                                                Reject
                                            </Button>
                                        </div>
                                    )}
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                    {entriesList.length === 0 && (
                        <TableRow>
                            <TableCell
                                colSpan={5 + (showVendor ? 1 : 0) + (isAdmin ? 1 : 0)}
                                className="text-center text-muted-foreground py-8"
                            >
                                No time entries yet
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                    Showing {entriesList.length} of {pagination.total} entries
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
