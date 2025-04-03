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
import { useState } from "react";

interface PaginationProps {
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
}

type Customer = z.infer<typeof customerSchema>;

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
export function CustomersTable({ customers, pagination }: { customers: Customer[], pagination: PaginationProps }) {

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

    const customersList = Array.isArray(customers) ? customers : [];

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
                    placeholder="Search customers..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="max-w-sm"
                />
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
                        <TableRow key={customer._id} className="cursor-pointer" onClick={() => {
                            router.push(`/dashboard/customers/${customer._id}/edit`);
                        }}>
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
                    Showing {customersList.length} of {pagination.total} invoices
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