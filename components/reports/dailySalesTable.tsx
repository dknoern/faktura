"use client";

import { fetchDailySalesData } from "@/lib/actions/daily-sales-actions";
import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface DailySalesTableProps {
    selectedDate: Date;
}

interface Invoice {
    _id: string;
    date: string | Date;
    lineItems: Array<{ name: string }>;
    salesPerson: string;
    methodOfSale: string;
    invoiceType: string;
}

export function DailySalesTable({ selectedDate }: DailySalesTableProps) {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await fetchDailySalesData(selectedDate);
                setInvoices(data);
            } catch (err) {
                setError('Failed to fetch daily sales data');
                console.error('Error fetching daily sales:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedDate]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-muted-foreground">Loading sales data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-destructive">{error}</div>
            </div>
        );
    }
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead style={{ whiteSpace: 'nowrap' }}>Item #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Rep Sale</TableHead>
                    <TableHead style={{ whiteSpace: 'nowrap' }}>Point of Sale</TableHead>
                    <TableHead>Type</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {invoices.map((invoice) => (
                    <TableRow key={invoice._id}>
                        <TableCell>{invoice._id}</TableCell>
                        <TableCell style={{ whiteSpace: 'nowrap' }}>{invoice.date ? new Date(invoice.date).toISOString().split('T')[0] : ''}</TableCell>
                        <TableCell>{invoice.lineItems[0].name}</TableCell>
                        <TableCell>{invoice.salesPerson}</TableCell>
                        <TableCell>{invoice.methodOfSale}</TableCell>
                        <TableCell>{invoice.invoiceType}</TableCell>
                     </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}