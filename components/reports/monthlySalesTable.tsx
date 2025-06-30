"use client";

import { fetchMonthlySalesData } from "@/lib/actions/monthly-sales-actions";
import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface MonthlySalesTableProps {
    selectedYear: number;
    selectedMonth: number;
}

interface Invoice {
    _id: string;
    customerFirstName: string;
    customerLastName: string;
    customerEmail: string;
    date: string | Date;
    total: number;
    lineItems: Array<{ itemNumber: string; name: string }>;
    salesPerson: string;
    shipState: string;
}

export function MonthlySalesTable({ selectedYear, selectedMonth }: MonthlySalesTableProps) {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await fetchMonthlySalesData(selectedYear, selectedMonth);
                setInvoices(data);
            } catch (err) {
                setError('Failed to fetch monthly sales data');
                console.error('Error fetching monthly sales:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedYear, selectedMonth]);

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
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Customer Email</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Item #</TableHead>
                    <TableHead> Description</TableHead>
                    <TableHead>Sold by</TableHead>
                    <TableHead>State</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {invoices.map((invoice) => {
                    const firstLineItem = invoice.lineItems && invoice.lineItems.length > 0 ? invoice.lineItems[0] : null;
                    return (
                        <TableRow key={invoice._id}>
                            <TableCell>{invoice.customerFirstName + ' ' + invoice.customerLastName}</TableCell>
                            <TableCell>{invoice.customerEmail}</TableCell>
                            <TableCell style={{ whiteSpace: 'nowrap' }}>{invoice.date ? new Date(invoice.date).toISOString().split('T')[0] : ''}</TableCell>
                            <TableCell style={{ textAlign: 'right' }}>{Math.ceil(invoice.total || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' }).replace('.00','')}</TableCell>
                            <TableCell>{firstLineItem?.itemNumber || 'N/A'}</TableCell>
                            <TableCell>{firstLineItem?.name || 'N/A'}</TableCell>
                            <TableCell>{invoice.salesPerson || 'N/A'}</TableCell>
                            <TableCell>{invoice.shipState || 'N/A'}</TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    )
}