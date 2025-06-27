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
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { CustomerSelectModalWrapper } from "../customers/select-modal-wrapper";
import { PlusCircle } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface PaginationProps {
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
}

interface Repair {
    _id: string;
    repairNumber: string;
    itemNumber: string;
    description: string;
    dateOut: string | null;
    customerApprovedDate: string | null;
    returnDate: string | null;
    customerFirstName: string;
    customerLastName: string;
    vendor: string;
    repairCost: number;
}

export function RepairsTable({ repairs, pagination }: { repairs: Repair[], pagination: PaginationProps }) {
    const repairsList = Array.isArray(repairs) ? repairs : [];

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [filterType, setFilterType] = useState(searchParams.get('filter') || 'outstanding');

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

    const handleFilterChange = (value: string) => {
        setFilterType(value);
        const params = new URLSearchParams(searchParams.toString());
        params.set('filter', value);
        params.set('page', '1'); // Reset to first page when filtering
        router.push(`${pathname}?${params.toString()}`);
    };
    
    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    const handleRowClick = (repairNumber: string) => {
        router.push(`/repairs/${repairNumber}/view`);
    };

    // Handle customer selection for new repair
    const handleCustomerSelect = (customer: any) => {
        setIsCustomerModalOpen(false);
        // Navigate to the new repair page with the selected customer ID
        router.push(`/repairs/new?customerId=${customer._id}`);
    };

    // Filter repairs based on selected filter type
    // Filtering is now handled server-side, so we use all repairs
    const filteredRepairs = repairsList;

    return (
        <div>
            <div className="mb-4 flex justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <Input
                        type="text"
                        placeholder="Search repairs..."
                        value={searchQuery}
                        onChange={handleSearch}
                        className="max-w-sm"
                    />
                    <Select value={filterType} onValueChange={handleFilterChange}>
                        <SelectTrigger className="w-48">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="outstanding">Outstanding Repairs</SelectItem>
                            <SelectItem value="all">All Repairs</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button variant="outline"
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="ml-auto"
                >
                    <PlusCircle className="mr-2 h-4 w-4" /> New Repair
                </Button>
            </div>
            
            {/* Customer selection modal */}
            <CustomerSelectModalWrapper 
                isOpen={isCustomerModalOpen}
                onClose={() => setIsCustomerModalOpen(false)}
                onSelect={handleCustomerSelect}
                customers={[]}
                pagination={{
                    total: 0,
                    pages: 1,
                    currentPage: 1,
                    limit: 10
                }}
            />
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
                    {filteredRepairs.map((repair: Repair) => (
                        <TableRow 
                            key={repair._id}
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => handleRowClick(repair._id)}
                        >
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
                    Showing {filteredRepairs.length} of {pagination.total} repairs
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