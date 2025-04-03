"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
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
    export function RepairsTable({repairs, pagination}: {repairs: any, pagination: PaginationProps}) {

        const repairsList = Array.isArray(repairs) ? repairs : [];

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
                    <TableHead style={{ whiteSpace: 'nowrap' }}>Repair</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Out</TableHead>
                    <TableHead>Approved</TableHead>
                    <TableHead>Returned</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Cost</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {repairsList.map((repair: any) => (
                    <TableRow key={repair.repairNumber}>
                        <TableCell>{repair.repairNumber}</TableCell>
                        <TableCell>{repair.itemNumber}</TableCell>
                        <TableCell>{repair.description}</TableCell>
                        <TableCell style={{ whiteSpace: 'nowrap' }}>{repair.dateOut ? new Date(repair.dateOut).toISOString().split('T')[0] : ''}</TableCell>
                        <TableCell style={{ whiteSpace: 'nowrap' }}>{repair.customerApprovedDate ? new Date(repair.customerApprovedDate).toISOString().split('T')[0] : ''}</TableCell>
                        <TableCell style={{ whiteSpace: 'nowrap' }}>{repair.returnDate ? new Date(repair.returnDate).toISOString().split('T')[0] : ''}</TableCell>
                        <TableCell style={{ whiteSpace: 'nowrap' }}>{repair.customerFirstName + ' ' + repair.customerLastName}</TableCell>
                        <TableCell style={{ whiteSpace: 'nowrap' }}>{repair.vendor}</TableCell>
                        <TableCell>{repair.repairCost}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>



        <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                    Showing {repairsList.length} of {pagination.total} repairs
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