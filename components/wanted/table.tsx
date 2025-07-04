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

interface PaginationProps {
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
}

interface Wanted {
    _id: string;
    title: string;
    description: string;
    customerName: string;
    customerId: number;
    createdDate: string;
    foundDate: string | null;
}

export function WantedTable({ wanted, pagination }: { wanted: Wanted[], pagination: PaginationProps }) {
    const wantedList = Array.isArray(wanted) ? wanted : [];

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

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

    const handleRowClick = (id: string) => {
        router.push(`/wanted/${id}/view`);
    };

    // Handle customer selection for new wanted item
    const handleCustomerSelect = (customer: any) => {
        setIsCustomerModalOpen(false);
        // Navigate to the new wanted page with the selected customer ID
        router.push(`/wanted/new?customerId=${customer._id}`);
    };

    return (
        <div>
            <div className="mb-4 flex justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <Input
                        type="text"
                        placeholder="Search wanted items..."
                        value={searchQuery}
                        onChange={handleSearch}
                        className="w-64"
                    />
                </div>
                <Button variant="outline"
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="ml-auto"
                >
                    <PlusCircle className="mr-2 h-4 w-4" /> New Wanted Item
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
                        <TableHead>Title</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Found</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {wantedList.map((item: Wanted) => (
                        <TableRow 
                            key={item._id}
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => handleRowClick(item._id)}
                        >
                            <TableCell className="font-medium">{item.title}</TableCell>
                            <TableCell>{item.customerName}</TableCell>
                            <TableCell style={{ whiteSpace: 'nowrap' }}>
                                {item.createdDate ? new Date(item.createdDate).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : ''}
                            </TableCell>
                            <TableCell style={{ whiteSpace: 'nowrap' }}>
                                {item.foundDate ? new Date(item.foundDate).toISOString().split('T')[0] : ''}
                            </TableCell>
                            <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                    item.foundDate 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {item.foundDate ? 'Found' : 'Wanted'}
                                </span>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                    Showing {wantedList.length} of {pagination.total} wanted items
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
