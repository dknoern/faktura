"use client"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import React, { useState, useRef, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "../ui/input";
import { PlusCircle } from "lucide-react";

interface LineItem {
    itemNumber?: string;
    name?: string;
    repairNumber?: string;
    repairCost?: number;
    productId?: string;
    repairId?: string;
}

interface Log {
    _id: string;
    date: Date;
    receivedFrom: string;
    comments?: string;
    user?: string;
    customerName?: string;
    vendor?: string;
    lineItems?: LineItem[];
}

interface Pagination {
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
}

export function LogsTable({ logs, pagination }: { logs: Log[], pagination: Pagination }) {

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', newPage.toString());
        router.push(`${pathname}?${params.toString()}`);
    };
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);

        // Clear any existing timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Set a new timeout
        searchTimeoutRef.current = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set('search', value);
                params.set('page', '1'); // Reset to first page when searching
            } else {
                params.delete('search');
            }
            router.push(`${pathname}?${params.toString()}`);
        }, 300); // 300ms debounce delay
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    const handleRowClick = (logId: string, e: React.MouseEvent) => {
        // Check if user is selecting text
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) {
            // User is selecting text, don't navigate
            return;
        }
        
        // Check if the click started and ended on the same element (not a drag)
        const target = e.target as HTMLElement;
        if (target.tagName === 'TD' || target.closest('td')) {
            router.push(`/loginitems/${logId}/view`);
        }
    };
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <div className="flex-1">
                    <Input
                        type="text"
                        placeholder="Search log in items..."
                        value={searchQuery}
                        onChange={handleSearch}
                        className="max-w-sm"
                    />
                </div>

                <Button variant="outline" onClick={() => router.push('/loginitems/new')}
                    className="ml-4 flex items-center gap-1"
                >
                    <PlusCircle size={18} />
                    <span>New Item</span>
                </Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead style={{ whiteSpace: 'nowrap' }}>Received From</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Item Received</TableHead>
                        <TableHead style={{ whiteSpace: 'nowrap' }}>Item #</TableHead>
                        <TableHead style={{ whiteSpace: 'nowrap' }}>Repair #</TableHead>
                        <TableHead>By</TableHead>
                        <TableHead>Comments</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.map((log: Log) => {

                        let itemNumbers = ''
                        let itemNames = ''
                        let repairNumbers = ''
                        if (log.lineItems != null) {

                            itemNumbers = log.lineItems.map((lineItem: LineItem) => lineItem.itemNumber || '').join('<br/>')
                            itemNames = log.lineItems.map((lineItem: LineItem) => lineItem.name || '').join('<br/>')
                            repairNumbers = log.lineItems.map((lineItem: LineItem) => lineItem.repairNumber || '').join('<br/>')

                        }

                        return (

                            <TableRow
                                key={log._id}
                                onClick={(e) => handleRowClick(log._id, e)}
                                className="cursor-pointer hover:bg-gray-100"
                                onMouseDown={(e) => {
                                    // Prevent text selection from interfering with click detection
                                    if (e.detail > 1) {
                                        e.preventDefault();
                                    }
                                }}

                                style={{ userSelect: 'text' }}
                            >


                                <TableCell style={{ whiteSpace: 'nowrap' }}>
                                    {log.date ? new Date(log.date).toLocaleDateString('en-US', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                    }) + ' ' + new Date(log.date).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: false
                                    }) : ''}
                                </TableCell>
                                <TableCell> {log.receivedFrom}</TableCell>
                                <TableCell> {log.customerName}</TableCell>
                                <TableCell> {log.vendor}</TableCell>

                                <TableCell>
                                    {itemNames.split("<br/>").map((line, index, array) => (
                                        <React.Fragment key={index}>
                                            {line}
                                            {index < array.length - 1 && <br />}
                                        </React.Fragment>
                                    ))}
                                </TableCell>
                                <TableCell>
                                    {itemNumbers.split("<br/>").map((line, index, array) => (
                                        <React.Fragment key={index}>
                                            {line}
                                            {index < array.length - 1 && <br />}
                                        </React.Fragment>
                                    ))}
                                </TableCell>

                                <TableCell>
                                    {repairNumbers.split("<br/>").map((line, index, array) => (
                                        <React.Fragment key={index}>
                                            {line}
                                            {index < array.length - 1 && <br />}
                                        </React.Fragment>
                                    ))}
                                </TableCell>
                                <TableCell> {log.user}</TableCell>
                                <TableCell> {log.comments}</TableCell>
                            </TableRow>
                        )
                    }
                    )}
                </TableBody>
            </Table>
            <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                    Showing {logs.length} of {pagination.total} logs
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
                        <span className="px-2">Page {pagination.currentPage} of {pagination.pages}</span>
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