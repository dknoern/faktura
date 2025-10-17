"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { CustomerSelectModalWrapper } from "@/components/customers/select-modal-wrapper";
import { customerSchema } from "@/lib/models/customer";
import { PlusCircle } from "lucide-react";

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
    total: number | null;
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
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [customers, setCustomers] = useState<z.infer<typeof customerSchema>[]>([]);
    const [customersPagination, setCustomersPagination] = useState({
        total: 0,
        pages: 1,
        currentPage: 1,
        limit: 10
    });
    
    // This effect loads customer data on the server side when needed
    useEffect(() => {
        if (isCustomerModalOpen) {
            // We'll use a server action to load the data
            const loadCustomers = async () => {
                try {
                    // Use the server action to fetch customers
                    const result = await fetch('/api/customers-data')
                        .then(res => res.json())
                        .catch(() => ({
                            customers: [],
                            pagination: { total: 0, pages: 1, currentPage: 1, limit: 10 }
                        }));
                    
                    setCustomers(result.customers || []);
                    setCustomersPagination(result.pagination || { 
                        total: 0, 
                        pages: 1, 
                        currentPage: 1, 
                        limit: 10 
                    });
                } catch (error) {
                    console.error('Error loading customers:', error);
                }
            };
            
            loadCustomers();
        }
    }, [isCustomerModalOpen]);

    const invoiceList = Array.isArray(invoices) ? invoices : [];

    const handleRowClick = (invoiceId: string, e: React.MouseEvent) => {
        // Check if user is selecting text
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) {
            // User is selecting text, don't navigate
            return;
        }
        
        // Check if the click started and ended on the same element (not a drag)
        const target = e.target as HTMLElement;
        if (target.tagName === 'TD' || target.closest('td')) {
            router.push(`/invoices/${invoiceId}/view`);
        }
    };

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
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <div className="flex-1">
                <Input
                    type="text"
                    placeholder="Search invoices..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="max-w-sm"
                />
                </div>
                <Button variant="outline"
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="ml-4 flex items-center gap-1"
                >
                    <PlusCircle size={18} />
                    <span>New Invoice</span>
                </Button>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
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
                            <TableRow 
                                key={invoice._id} 
                                onClick={(e) => handleRowClick(invoice._id, e)}
                                className="cursor-pointer hover:bg-gray-100"
                                onMouseDown={(e) => {
                                    // Prevent text selection from interfering with click detection
                                    if (e.detail > 1) {
                                        e.preventDefault();
                                    }
                                }}

                                style={{ userSelect: 'text' }}
                            >
                                <TableCell>{invoice._id}</TableCell>
                                <TableCell> {invoice.customerFirstName + ' ' + invoice.customerLastName}</TableCell>
                                <TableCell style={{ whiteSpace: 'nowrap' }}>{invoice.date ? new Date(invoice.date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : ''}</TableCell>
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
                                <TableCell style={{ textAlign: 'right' }}>{(invoice.total ?? 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                        invoice.invoiceType === 'Memo' 
                                            ? 'bg-yellow-100 text-yellow-800' 
                                            : invoice.invoiceType === 'Partner'
                                            ? 'bg-blue-100 text-blue-800'
                                            : invoice.invoiceType === 'Consignment'
                                            ? 'bg-gray-100 text-gray-800'
                                            : 'bg-green-100 text-green-800'
                                    }`}>
                                        {invoice.invoiceType}
                                    </span>
                                </TableCell>
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

            {/* Customer selection modal */}
            <CustomerSelectModalWrapper
                isOpen={isCustomerModalOpen}
                onClose={() => setIsCustomerModalOpen(false)}
                onSelect={(customer) => {
                    router.push(`/invoices/new?customerId=${customer._id}`);
                    setIsCustomerModalOpen(false);
                }}
                customers={customers}
                pagination={customersPagination}
            />
        </div>
    )
}