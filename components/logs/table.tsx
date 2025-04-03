"use client"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,

} from "@/components/ui/table"
import { LinkTableCell } from "../LinkTableCell";
import React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface PaginationProps {
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
}

export function LogsTable({logs, pagination}: {logs: any, pagination: any}) {

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', newPage.toString());
        router.push(`${pathname}?${params.toString()}`);
    };


    const logsList = Array.isArray(logs) ? logs : [];
    return (
        <div>
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
                    {logsList.map((log: any) => {

                    let itemNumbers = ''
                    let itemNames = ''
                    let repairNumbers = ''
                    if (log.lineItems != null) {

                        itemNumbers = log.lineItems.map((lineItem: { itemNumber: string; }) => lineItem.itemNumber).join('<br/>')
                        itemNames = log.lineItems.map((lineItem: { name: string; }) => lineItem.name).join('<br/>')
                        repairNumbers = log.lineItems.map((lineItem: { repairNumber: string; }) => lineItem.repairNumber).join('<br/>')

                    }

                    return (
                        <TableRow key={log._id}>





                            <LinkTableCell  style={{ whiteSpace: 'nowrap' }} href={`/dashboard/loginitems/${log._id}/edit`}>
                                {log.date ? new Date(log.date).toLocaleDateString('en-US', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                }) + ' ' + new Date(log.date).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false
                                }) : ''}
                            </LinkTableCell>
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
                    Showing {logsList.length} of {pagination.total} logs
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