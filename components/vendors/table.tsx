"use client"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { vendorSchema } from "@/lib/models/vendor";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface PaginationProps {
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
}

type Vendor = z.infer<typeof vendorSchema>;

interface VendorsTableProps {
    vendors: Vendor[]
    pagination: PaginationProps
}

export function VendorsTable({ vendors, pagination }: VendorsTableProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const vendorsList = Array.isArray(vendors) ? vendors : [];

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', newPage.toString());
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleRowClick = (vendor: Vendor, e: React.MouseEvent) => {
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) {
            return;
        }
        const target = e.target as HTMLElement;
        if (target.tagName === 'TD' || target.closest('td')) {
            router.push(`/vendors/${vendor._id}/view`);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set('search', value);
                params.set('page', '1');
            } else {
                params.delete('search');
            }
            router.push(`${pathname}?${params.toString()}`);
        }, 300);
    };

    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div>
            <div className="flex justify-between items-center mb-4 space-x-2">
                <div className="flex-1">
                    <Input
                        type="text"
                        placeholder="Search vendors..."
                        value={searchQuery}
                        onChange={handleSearch}
                        className="max-w-sm"
                    />
                </div>

                <Button
                    variant="outline"
                    onClick={() => router.push('/vendors/new')}
                    className="ml-4 flex items-center gap-1"
                >
                    <PlusCircle size={18} />
                    <span>New Vendor</span>
                </Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Number</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Account</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {vendorsList.map((vendor: Vendor) => (
                        <TableRow
                            key={vendor._id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={(e) => handleRowClick(vendor, e)}
                            onMouseDown={(e) => {
                                if (e.detail > 1) {
                                    e.preventDefault();
                                }
                            }}
                            style={{ userSelect: 'text' }}
                        >
                            <TableCell>{vendor.vendorNumber}</TableCell>
                            <TableCell>{vendor.firstName + ' ' + vendor.lastName}</TableCell>
                            <TableCell>{vendor.company}</TableCell>
                            <TableCell>{vendor.email}</TableCell>
                            <TableCell>{vendor.phone}</TableCell>
                            <TableCell>
                                {vendor.acceptedAt ? (
                                    <Badge variant="default">Active</Badge>
                                ) : vendor.auth0UserId ? (
                                    <Badge variant="outline">Invitation pending</Badge>
                                ) : (
                                    <Badge variant="secondary">Not invited</Badge>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                    Showing {vendorsList.length} of {pagination.total} vendors
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
