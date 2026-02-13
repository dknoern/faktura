import { getAllStock } from "@/lib/reports";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export async function AllStockTable() {

    const products = await getAllStock();
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead style={{ whiteSpace: 'nowrap' }}>Item #</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Update</TableHead>
                    <TableHead>Seller</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {products.map((product) => (
                    <TableRow key={product._id}>
                        <TableCell>{product.itemNumber}</TableCell>
                        <TableCell>{product.title}</TableCell>
                        <TableCell>{product.type}</TableCell>
                        <TableCell style={{ whiteSpace: 'nowrap' }}>{product.status}</TableCell>
                        <TableCell style={{ whiteSpace: 'nowrap' }}>{product.lastUpdated ? new Date(product.lastUpdated).toISOString().split('T')[0] : ''}</TableCell>
                        <TableCell>{product.seller}</TableCell>
                     </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
