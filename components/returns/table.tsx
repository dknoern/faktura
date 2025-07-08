"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import React, { useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { useSearchParams } from "next/navigation";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { useState } from "react";

interface PaginationProps {
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
}

interface LineItem {
    itemNumber: string;
    included: boolean;
}

interface Return {
    _id: string;
    invoiceId: string;
    lineItems: LineItem[];
    returnDate: string | null;
    customerName: string;
    salesPerson: string;
    totalReturnAmount: number | null;
}

export function ReturnsTable({ returns, pagination }: { returns: Return[], pagination: PaginationProps }) {
    const returnsList = Array.isArray(returns) ? returns : [];


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

    const handleRowClick = (returnId: string, e: React.MouseEvent) => {
        // Check if user is selecting text
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) {
            // User is selecting text, don't navigate
            return;
        }
        
        // Check if the click started and ended on the same element (not a drag)
        const target = e.target as HTMLElement;
        if (target.tagName === 'TD' || target.closest('td')) {
            router.push(`/returns/${returnId}/view`);
        }
    };

    return (

        <div>
            <div className="mb-4">
                <Input
                    type="text"
                    placeholder="Search returns..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="max-w-sm"
                />
            </div>
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
                    {returns.map((ret: Return) => {
                        return (
                            <TableRow 
                                key={ret._id} 
                                onClick={(e) => handleRowClick(ret._id, e)} 
                                className="cursor-pointer hover:bg-gray-50"
                                onMouseDown={(e) => {
                                    // Prevent text selection from interfering with click detection
                                    if (e.detail > 1) {
                                        e.preventDefault();
                                    }
                                }}

                                style={{ userSelect: 'text' }}
                            >
                                <TableCell>{ret._id}</TableCell>
                                <TableCell>{ret.invoiceId}</TableCell>
                                <TableCell>
                                    {ret.lineItems
                                        .filter((lineItem: LineItem) => lineItem.itemNumber !== '')
                                        .map((lineItem: LineItem, index: number) => (
                                            <React.Fragment key={index}>
                                                <span className={!lineItem.included ? 'line-through text-gray-500' : ''}>
                                                    {lineItem.itemNumber}
                                                </span>
                                                {index < ret.lineItems.filter(item => item.itemNumber !== '').length - 1 && <br />}
                                            </React.Fragment>
                                        ))}
                                </TableCell>
                                <TableCell>{ret.returnDate ? new Date(ret.returnDate).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : ''}</TableCell>
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