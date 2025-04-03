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

interface PaginationProps {
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
}
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
export function CustomersTable({ customers, pagination }: { customers: any[], pagination: PaginationProps }) {

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const customersList = Array.isArray(customers) ? customers : [];

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
                    <TableHead>Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Company</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {customersList.map((customer: any) => (
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