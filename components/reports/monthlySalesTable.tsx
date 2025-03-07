import { getMonthlySales } from "@/lib/reports";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export async function MonthlySalesTable() {

    const invoices = await getMonthlySales(2025,3);
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
                {invoices.map((invoice) => (
                    <TableRow key={invoice._id}>
                        <TableCell>{invoice.customerFirstName + ' ' + invoice.customerLastName}</TableCell>
                        <TableCell>{invoice.customerEmail}</TableCell>
                        <TableCell style={{ whiteSpace: 'nowrap' }}>{invoice.date ? new Date(invoice.date).toISOString().split('T')[0] : ''}</TableCell>
                        <TableCell style={{ textAlign: 'right' }}>{Math.ceil(invoice.total).toLocaleString('en-US', { style: 'currency', currency: 'USD' }).replace('.00','')}</TableCell>
                        <TableCell>{invoice.lineItems[0].itemNumber}</TableCell>
                        <TableCell>{invoice.lineItems[0].name}</TableCell>
                        <TableCell>{invoice.salesPerson}</TableCell>
                        <TableCell>{invoice.shipState}</TableCell>
                     </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}