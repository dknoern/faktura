"use client"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import React, { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "../ui/input";

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

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', newPage.toString());
        router.push(`${pathname}?${params.toString()}`);
    };
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set('search', value);
            params.set('page', '1'); // Reset to first page when searching
        } else {
            params.delete('search');
        }
        router.push(`${pathname}?${params.toString()}`);
    };
    return (
        <div>
            <div className="mb-4">
                <Input
                    type="text"
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="max-w-sm"
                />
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead style={{ whiteSpace: 'nowrap' }}>Received From</TableHead>
                        <TableHead>Customer</TableHead>
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
                                onClick={() => router.push(`/dashboard/loginitems/${log._id}/edit`)}
                                className="cursor-pointer hover:bg-gray-100">
                        

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