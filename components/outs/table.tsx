"use client"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface PaginationProps {
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
}

interface Out {
    _id: string;
    date: string | null;
    sentTo: string;
    description: string;
    comments: string;
    user: string;
    search?: string;
    signature?: string;
    signatureDate?: string | null;
    signatureUser?: string;
}

export function OutsTable({outs, pagination}: {outs: Out[], pagination: PaginationProps}) {

    const outsList = Array.isArray(outs) ? outs : [];

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
                    <TableHead>Date</TableHead>
                    <TableHead style={{ whiteSpace: 'nowrap' }}>Sent To</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>By</TableHead>
                    <TableHead>Comments</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {outsList.map((out: Out) => {
                    return (
                        <TableRow key={out._id}>
                            <TableCell style={{ whiteSpace: 'nowrap' }}>{out.date ? new Date(out.date).toISOString().split('T')[0] : ''}</TableCell>
                            <TableCell> {out.sentTo}</TableCell>
                            <TableCell> {out.description}</TableCell>
                            <TableCell> {out.user}</TableCell>
                            <TableCell> {out.comments}</TableCell>
                        </TableRow>
                    )
                }
                )}
                </TableBody>
        </Table>
            <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                    Showing {outsList.length} of {pagination.total} logs
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