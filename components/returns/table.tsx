import { fetchReturns } from "@/lib/data";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import React from "react";

export async function ReturnsTable() {

    const returns = await fetchReturns();
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead style={{ whiteSpace: 'nowrap' }}>Return</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead style={{ whiteSpace: 'nowrap' }}>Sales Person</TableHead>
                    <TableHead>Total</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {returns.map((ret) => {

                    let itemNumbers = ''

                    if (ret.lineItems != null) {
                        itemNumbers = ret.lineItems
                            .filter((lineItem: { itemNumber: string; }) => lineItem.itemNumber.trim() !== '')
                            .map((lineItem: { itemNumber: string; }) => lineItem.itemNumber)
                            .join('<br/>');
                    }

                    return (
                        <TableRow key={ret._id}>
                            <TableCell>{ret._id}</TableCell>
                            <TableCell>{ret.invoiceId}</TableCell>
                            <TableCell>
                                {itemNumbers.split("<br/>").map((line, index, array) => (
                                    <React.Fragment key={index}>
                                        {line}
                                        {index < array.length - 1 && <br />}
                                    </React.Fragment>
                                ))}
                            </TableCell>
                            <TableCell>{ret.returnDate ? new Date(ret.returnDate).toISOString().split('T')[0] : ''}</TableCell>
                            <TableCell>{ret.customerName}</TableCell>
                            <TableCell> {ret.salesPerson}</TableCell>
                            <TableCell>{ret.totalReturnAmount ? Math.ceil(ret.totalReturnAmount).toLocaleString('en-US', { style: 'currency', currency: 'USD' }).replace('.00', '') : ''}</TableCell>
                        </TableRow>
                    )
                }
                )}
            </TableBody>
        </Table>
    )
}