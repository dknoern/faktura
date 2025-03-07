import { getDailySales } from "@/lib/reports";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export async function DailySalesTable() {

    const invoices = await getDailySales(2025,3,5);
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