"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface PaginationProps {
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
}

interface LineItem {
    itemNumber: string;
    name: string;
}

interface Invoice {
    _id: string;
    customerFirstName: string;
    customerLastName: string;
    date: string;
    lineItems: LineItem[];
    trackingNumber: string;
    total: number;
    invoiceType: string;
}

export function InvoicesTable({ 
    invoices, 
    pagination 
}: { 
    invoices: Invoice[],
    pagination: PaginationProps
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const invoiceList = Array.isArray(invoices) ? invoices : [];

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', newPage.toString());
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div>
            <Table>
                <TableHeader>
                    <TableRow onClick={() => {
                        alert('hi')
                        console.log('hi')
                    }}>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead style={{ whiteSpace: 'nowrap' }}>Date</TableHead>
                        <TableHead style={{ whiteSpace: 'nowrap' }}>Item #</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead style={{ whiteSpace: 'nowrap' }}>Tracking #</TableHead>
                        <TableHead style={{ textAlign: 'right' }}>Total</TableHead>
                        <TableHead>Type</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoices.map((invoice) => {

                        let itemNumbers = ''
                        let itemNames = ''
                        if (invoice.lineItems != null) {

                            itemNumbers = invoice.lineItems.map((lineItem: { itemNumber: string; }) => lineItem.itemNumber).join('<br/>')
                            itemNames = invoice.lineItems.map((lineItem: { name: string; }) => lineItem.name).join('<br/>')

                        }

                        return (
                            <TableRow key={invoice._id} onClick={() => {
                                alert('selected invoice: ' + invoice._id)   
                            }} className="cursor-pointer">
                                <TableCell>{invoice._id}</TableCell>
                                <TableCell> {invoice.customerFirstName + ' ' + invoice.customerLastName}</TableCell>
                                <TableCell style={{ whiteSpace: 'nowrap' }}>{invoice.date ? new Date(invoice.date).toISOString().split('T')[0] : ''}</TableCell>
                                <TableCell>
                                    {itemNumbers.split("<br/>").map((line, index, array) => (
                                        <React.Fragment key={index}>
                                            {line}
                                            {index < array.length - 1 && <br />}
                                        </React.Fragment>
                                    ))}
                                </TableCell>
                                <TableCell>
                                    {itemNames.split("<br/>").map((line, index, array) => (
                                        <React.Fragment key={index}>
                                            {line}
                                            {index < array.length - 1 && <br />}
                                        </React.Fragment>
                                    ))}
                                </TableCell>
                                <TableCell> {invoice.trackingNumber}</TableCell>
                                <TableCell style={{ textAlign: 'right' }}>{Math.ceil(invoice.total).toLocaleString('en-US', { style: 'currency', currency: 'USD' }).replace('.00','')}</TableCell>
                                <TableCell> {invoice.invoiceType}</TableCell>
                            </TableRow>
                        )
                    }
                    )}
                </TableBody>
            </Table>
            
            <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                    Showing {invoiceList.length} of {pagination.total} invoices
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