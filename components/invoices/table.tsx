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
                <Button
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
                                onClick={() => router.push(`/dashboard/invoices/${invoice._id}/view`)}
                                className="cursor-pointer hover:bg-gray-100">
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
                                <TableCell style={{ textAlign: 'right' }}>{Math.ceil(invoice.total).toLocaleString('en-US', { style: 'currency', currency: 'USD' }).replace('.00', '')}</TableCell>
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

            {/* Customer selection modal */}
            <CustomerSelectModalWrapper
                isOpen={isCustomerModalOpen}
                onClose={() => setIsCustomerModalOpen(false)}
                onSelect={(customer) => {
                    router.push(`/dashboard/invoices/new?customerId=${customer._id}`);
                    setIsCustomerModalOpen(false);
                }}
                customers={customers}
                pagination={customersPagination}
            />
        </div>
    )
}