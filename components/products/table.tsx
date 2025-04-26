"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { Badge } from "../ui/badge";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { productSchema } from "@/lib/models/product";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";

interface PaginationProps {
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
}

export function ProductsTable({ products, pagination }: { products: (z.infer<typeof productSchema> & { _id: string })[], pagination: PaginationProps }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const productsList = Array.isArray(products) ? products : [];

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
            <div className="mb-4">
                <Input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="max-w-sm"
                />
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead style={{ whiteSpace: 'nowrap' }}>Item No</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Serial No</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Model No</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Updated</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {productsList.map((product) => (
                        <TableRow key={product._id} onClick={() => {
                            router.push(`/dashboard/products/${product._id}/edit`)
                        }} className="cursor-pointer">
                            <TableCell>{product.itemNumber}</TableCell>
                            <TableCell>{product.title}</TableCell>
                            <TableCell>{product.serialNo}</TableCell>
                            <TableCell style={{ textAlign: 'right' }}>{product.cost ? Math.ceil(product.cost).toLocaleString('en-US', { style: 'currency', currency: 'USD' }).replace('.00', '') : ''}</TableCell>
                            <TableCell>{product.modelNumber}</TableCell>
                            <TableCell style={{ whiteSpace: 'nowrap' }}>
                                <Badge style={{ backgroundColor: product.status === 'In Stock' ? 'green' : product.status === 'Sold' ? 'grey' : 'yellow' }}>
                                    {product.status}
                                </Badge>
                            </TableCell>
                            <TableCell style={{ whiteSpace: 'nowrap' }}>{product.lastUpdated ? new Date(product.lastUpdated).toISOString().split('T')[0] : ''}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                    Showing {products.length} of {pagination.total} invoices
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