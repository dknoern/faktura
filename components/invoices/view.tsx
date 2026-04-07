"use client";

import * as React from "react";
import { Invoice, formatCurrency } from "@/lib/invoice-renderer";
import { InvoiceActionMenu } from "./invoice-action-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
};

const invoiceTypeLabel = (type: string) => {
    switch (type) {
        case 'Partner': return 'Partner Invoice';
        case 'Memo': return 'Memo';
        case 'Estimate': return 'Estimate';
        default: return 'Invoice';
    }
};

export function ViewInvoice({ invoice }: { invoice: Invoice }) {
    const fullName = `${invoice.customerFirstName} ${invoice.customerLastName}`.trim();
    const addressLines = [
        invoice.shipAddress1,
        invoice.shipAddress2,
        invoice.shipAddress3,
        [invoice.shipCity, invoice.shipState].filter(Boolean).join(', ') + (invoice.shipZip ? ` ${invoice.shipZip}` : ''),
    ].filter(Boolean);

    const detailLines = [
        invoice.shipVia && `Ship Via: ${invoice.shipVia}`,
        invoice.trackingNumber && `Tracking Number: ${invoice.trackingNumber}`,
        invoice.salesPerson && `Sold By: ${invoice.salesPerson}`,
        invoice.methodOfSale && `Method of Sale: ${invoice.methodOfSale}`,
        invoice.paidBy && `Paid By: ${invoice.paidBy}`,
        invoice.authNumber && `Auth #: ${invoice.authNumber}`,
    ].filter(Boolean) as string[];

    return (
        <div className="container mx-auto px-8">
            <div className="bg-white p-8 rounded-lg shadow">

                {/* Top: Invoice type label + action menu */}
                <div className="flex items-start justify-between mb-2">
                    <h1 className="text-2xl font-semibold" style={{ color: '#B69D57' }}>
                        {invoiceTypeLabel(invoice.invoiceType).toUpperCase()}
                    </h1>
                    <InvoiceActionMenu invoice={invoice} />
                </div>

                {/* Header row: customer address left, invoice meta right */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="text-sm font-bold uppercase">{fullName}</p>
                        {addressLines.map((line, i) => (
                            <p key={i} className="text-sm font-bold uppercase">{line}</p>
                        ))}
                        {invoice.customerPhone && (
                            <p className="text-sm font-bold uppercase">{invoice.customerPhone}</p>
                        )}
                        {invoice.customerEmail && (
                            <p className="text-sm font-bold uppercase">{invoice.customerEmail}</p>
                        )}
                    </div>
                    <div className="text-right text-sm space-y-0.5">
                        <p>{invoiceTypeLabel(invoice.invoiceType)} #{invoice.invoiceNumber}</p>
                        <p>Date: {formatDate(invoice.date)}</p>
                        {detailLines.map((line, i) => (
                            <p key={i}>{line}</p>
                        ))}
                    </div>
                </div>

                {/* Line Items Table */}
                <div className="rounded-md border mb-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="font-bold">ITEM DESCRIPTION</TableHead>
                                <TableHead className="text-right font-bold">TOTAL</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoice.lineItems.length > 0 ? (
                                invoice.lineItems.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="py-4">
                                            <div className="font-bold uppercase text-sm">{item.name}</div>
                                            {item.longDesc && (
                                                <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.longDesc}</div>
                                            )}
                                            {(item.serialNumber || item.itemNumber) && (
                                                <div className="flex gap-6 mt-2 text-xs text-muted-foreground">
                                                    {item.serialNumber && <span>Serial No: {item.serialNumber}</span>}
                                                    {item.itemNumber && <span>SKU: {item.itemNumber}</span>}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right align-top py-4 font-medium">
                                            {formatCurrency(item.amount)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                                        No line items
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Totals */}
                <div className="flex justify-end mb-2">
                    <div className="w-72 space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-right flex-1 mr-4">SUBTOTAL:</span>
                            <span className="w-24 text-right">{formatCurrency(invoice.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-right flex-1 mr-4">TAX:</span>
                            <span className="w-24 text-right">{formatCurrency(invoice.tax)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-right flex-1 mr-4">SHIPPING:</span>
                            <span className="w-24 text-right">{formatCurrency(invoice.shipping)}</span>
                        </div>
                        <div className="flex justify-between text-base font-bold pt-1">
                            <span className="text-right flex-1 mr-4">TOTAL DUE:</span>
                            <span className="w-24 text-right">{formatCurrency(invoice.total)}</span>
                        </div>
                    </div>
                </div>

                <p className="text-right text-sm text-muted-foreground mt-2">Thank you for your business</p>

            </div>
        </div>
    );
}
