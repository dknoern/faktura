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
import { PlusCircle } from "lucide-react";

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


            <div className="flex justify-between items-center mb-4">
                <div className="flex-1">
                    <Input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={handleSearch}
                        className="max-w-sm"
                    />
                </div>

                    <Button variant="outline" onClick={() => router.push('/products/new')}
                        className="ml-4 flex items-center gap-1"
                    >
                        <PlusCircle size={18} />
                        <span>New Product</span>
                    </Button>

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
                            router.push(`/products/${product._id}/view`)
                        }} className="cursor-pointer">
                            <TableCell>{product.itemNumber}</TableCell>
                            <TableCell>{product.title}</TableCell>
                            <TableCell>{product.serialNo}</TableCell>
                            <TableCell style={{ textAlign: 'right' }}>{product.cost ? Math.ceil(product.cost).toLocaleString('en-US', { style: 'currency', currency: 'USD' }).replace('.00', '') : ''}</TableCell>
                            <TableCell>{product.modelNumber}</TableCell>
                            <TableCell style={{ whiteSpace: 'nowrap' }}>
                                <Badge style={{ backgroundColor: product.status === 'In Stock' ? 'green' : product.status === 'Sold' ? 'grey' : product.status === 'Incoming' ? 'teal' : product.status === 'Sale Pending' ? 'red' : 'orange' }}>
                                    {product.sellerType === 'Partner' && product.status !== 'Sold' ? 'Partnership' : product.status}
                                </Badge>
                            </TableCell>

                            {/* show date in format yyyy-mm-dd but for local timezone */}
                            <TableCell style={{ whiteSpace: 'nowrap' }}>{product.lastUpdated ? new Date(product.lastUpdated).toLocaleDateString('fr-Ca', { year: 'numeric', month: '2-digit', day: '2-digit' }) : ''}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                    Showing {products.length} of {pagination.total} products
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