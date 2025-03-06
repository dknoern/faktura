import { fetchInvoices } from "@/lib/data";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import React from "react";

export async function InvoicesTable() {

    const invoices = await fetchInvoices();
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Item #</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Tracking #</TableHead>
                    <TableHead style={{ textAlign: 'right' }}>Total</TableHead>
                    <TableHead>Type</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {invoices.map((invoice) => {

                    let itemNumbers = ''
                    let itemNames = ''
                    if (invoice.lineItems != null) {

                        itemNumbers = invoice.lineItems.map((lineItem: { itemNumber: string; }) => lineItem.itemNumber).join('<br/>')
                        itemNames = invoice.lineItems.map((lineItem: { name: string; }) => lineItem.name).join('<br/>')

                    }

                    return (
                        <TableRow key={invoice._id}>
                            <TableCell> {invoice._id}</TableCell>
                            <TableCell> {invoice.customerFirstName + ' ' + invoice.customerLastName}</TableCell>
                            <TableCell>{invoice.date ? new Date(invoice.date).toISOString().split('T')[0] : ''}</TableCell>
                            <TableCell>
                                {itemNumbers.split("<br/>").map((line, index, array) => (
                                    <React.Fragment key={index}>
                                        {line}
                                        {index < array.length - 1 && <br />}
                                    </React.Fragment>
                                ))}
                            </TableCell>
                            <TableCell>
                                {itemNames.split("<br/>").map((line, index, array) => (
                                    <React.Fragment key={index}>
                                        {line}
                                        {index < array.length - 1 && <br />}
                                    </React.Fragment>
                                ))}
                            </TableCell>
                            <TableCell> {invoice.trackingNumber}</TableCell>
                            <TableCell style={{ textAlign: 'right' }}>{Math.ceil(invoice.total).toLocaleString('en-US', { style: 'currency', currency: 'USD' }).replace('.00','')}</TableCell>
                            <TableCell> {invoice.invoiceType}</TableCell>
                        </TableRow>
                    )
                }
                )}
                </TableBody>
        </Table>
    )
}