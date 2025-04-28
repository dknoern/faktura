"use client"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { customerSchema } from "@/lib/models/customer";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";

interface PaginationProps {
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
}

type Customer = z.infer<typeof customerSchema>;

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCallback } from "react";
interface CustomersTableProps {
    customers: Customer[]
    pagination: PaginationProps
    isModal?: boolean
    onSelectCustomer?: (customer: Customer) => void
    modalRouter?: any
    onSearch?: (query: string) => void
    onPageChange?: (page: number) => void
}

export function CustomersTable({ 
    customers, 
    pagination,
    isModal = false,
    onSelectCustomer,
    modalRouter,
    onSearch,
    onPageChange
}: CustomersTableProps) {

    // Always call hooks unconditionally at the top level
    const defaultRouter = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    // Use the modal router if provided (for modal mode), otherwise use the real router
    const router = modalRouter || defaultRouter;
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // Check if we're in customer selection mode for invoices
    const selectForInvoice = !isModal && searchParams.get('selectForInvoice') === 'true';

    const customersList = Array.isArray(customers) ? customers : [];

    const handlePageChange = (newPage: number) => {
        if (isModal && onPageChange) {
            // If in modal mode and onPageChange is provided, use it
            onPageChange(newPage);
        } else {
            // Otherwise use the normal URL-based pagination
            const params = new URLSearchParams(searchParams.toString());
            params.set('page', newPage.toString());
            router.push(`${pathname}?${params.toString()}`);
        }
    };
    
    const handleCustomerClick = useCallback((customer: Customer) => {
        if (isModal && onSelectCustomer) {
            // If in modal mode, call the onSelectCustomer callback
            onSelectCustomer(customer);
        } else if (selectForInvoice) {
            // If in selection mode, navigate to new invoice with customer ID
            router.push(`/dashboard/invoices/new?customerId=${customer._id}`);
        } else {
            // Otherwise, navigate to customer edit page as usual
            router.push(`/dashboard/customers/${customer._id}/edit`);
        }
    }, [router, selectForInvoice, isModal, onSelectCustomer]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);
        
        // Clear any existing timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        // Set a new timeout
        searchTimeoutRef.current = setTimeout(() => {
            if (isModal && onSearch) {
                // If in modal mode and onSearch is provided, use it
                onSearch(value);
            } else {
                // Otherwise use the normal URL-based search
                const params = new URLSearchParams(searchParams.toString());
                if (value) {
                    params.set('search', value);
                    params.set('page', '1'); // Reset to first page when searching
                } else {
                    params.delete('search');
                }
                router.push(`${pathname}?${params.toString()}`);
            }
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
            <div className="mb-4 flex justify-between items-center">
                <div>
                    <Input
                        type="text"
                        placeholder="Search customers..."
                        value={searchQuery}
                        onChange={handleSearch}
                        className="max-w-sm"
                    />
                </div>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Number</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Company</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {customersList.map((customer: Customer) => (
                        <TableRow 
                            key={customer._id} 
                            className="cursor-pointer hover:bg-gray-100" 
                            onClick={() => handleCustomerClick(customer)}
                        >
                            <TableCell>{customer._id}</TableCell>
                            <TableCell> {customer.firstName + ' ' + customer.lastName}</TableCell>
                            <TableCell>{customer.city}</TableCell>
                            <TableCell>{customer.email}</TableCell>
                            <TableCell> {customer.phone}</TableCell>
                            <TableCell> {customer.company}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>


            <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                    Showing {customersList.length} of {pagination.total} customers
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