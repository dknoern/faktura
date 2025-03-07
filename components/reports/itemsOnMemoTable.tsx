import { getItemsOnMemo } from "@/lib/reports";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export async function ItemsOnMemoTable() {

    const products = await getItemsOnMemo();
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead style={{ whiteSpace: 'nowrap' }}>Item #</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead style={{ whiteSpace: 'nowrap' }}>Memo Date</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {products.map((product) => (
                    <TableRow key={product._id}>
                        <TableCell>{product.itemNumber}</TableCell>
                        <TableCell>{product.title}</TableCell>
                        <TableCell>{product.seller}</TableCell>
                        <TableCell style={{ whiteSpace: 'nowrap' }}>{product.lastUpdated ? new Date(product.lastUpdated).toISOString().split('T')[0] : ''}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}