"use client"

import { fetchReturns } from "@/lib/data";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import React from "react";
import { Button } from "../ui/button";
import { useSearchParams } from "next/navigation";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

interface PaginationProps {
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
}
export function ReturnsTable({returns, pagination}: {returns: any, pagination: PaginationProps}) {
    const returnsList = Array.isArray(returns) ? returns : [];


    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();


    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', newPage.toString());
        router.push(`${pathname}?${params.toString()}`);
    };


    return (

        <div>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead style={{ whiteSpace: 'nowrap' }}>Return</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead style={{ whiteSpace: 'nowrap' }}>Sales Person</TableHead>
                    <TableHead>Total</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {returns.map((ret: any) => {

                    let itemNumbers = ''

                    if (ret.lineItems != null) {
                        itemNumbers = ret.lineItems
                            .filter((lineItem: { itemNumber: string; }) => lineItem.itemNumber.trim() !== '')
                            .map((lineItem: { itemNumber: string; }) => lineItem.itemNumber)
                            .join('<br/>');
                    }

                    return (
                        <TableRow key={ret._id}>
                            <TableCell>{ret._id}</TableCell>
                            <TableCell>{ret.invoiceId}</TableCell>
                            <TableCell>
                                {itemNumbers.split("<br/>").map((line, index, array) => (
                                    <React.Fragment key={index}>
                                        {line}
                                        {index < array.length - 1 && <br />}
                                    </React.Fragment>
                                ))}
                            </TableCell>
                            <TableCell>{ret.returnDate ? new Date(ret.returnDate).toISOString().split('T')[0] : ''}</TableCell>
                            <TableCell>{ret.customerName}</TableCell>
                            <TableCell> {ret.salesPerson}</TableCell>
                            <TableCell>{ret.totalReturnAmount ? Math.ceil(ret.totalReturnAmount).toLocaleString('en-US', { style: 'currency', currency: 'USD' }).replace('.00', '') : ''}</TableCell>
                        </TableRow>
                    )
                }
                )}
            </TableBody>
        </Table>


        <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                    Showing {returnsList.length} of {pagination.total} invoices
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