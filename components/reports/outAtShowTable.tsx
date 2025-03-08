import { getOutAtShow } from "@/lib/reports";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export async function OutAtShowTable() {

    const products = await getOutAtShow();
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead style={{ whiteSpace: 'nowrap' }}>Item #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>

                </TableRow>
            </TableHeader>
            <TableBody>
                {products.map((product) => (
                    <TableRow key={product._id}>
                        <TableCell>{product._id}</TableCell>
                        <TableCell style={{ whiteSpace: 'nowrap' }}>{product.lastUpdated ? new Date(product.lastUpdated).toISOString().split('T')[0] : ''}</TableCell>
                        <TableCell>{product.description}</TableCell>
                     </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}