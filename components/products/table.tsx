import { fetchProducts } from "@/lib/data";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { LinkTableCell } from "../LinkTableCell";

export async function ProductsTable() {

    const products = await fetchProducts();
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead style={{ whiteSpace: 'nowrap' }}>Item No</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Serial No</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Model No</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {products.map((product) => (


                    <TableRow key={product.itemNumber}>
                        <LinkTableCell href={`/dashboard/products/${product._id}/edit`}>
                            {product.itemNumber}</LinkTableCell>
                        <TableCell>{product.title}</TableCell>
                        <TableCell>{product.serialNo}</TableCell>
                        <TableCell style={{ textAlign: 'right' }}>{Math.ceil(product.cost).toLocaleString('en-US', { style: 'currency', currency: 'USD' }).replace('.00','')}</TableCell>
                        <TableCell>{product.modelNumber}</TableCell>
                        <TableCell style={{ whiteSpace: 'nowrap' }}>{product.status}</TableCell>
                        <TableCell style={{ whiteSpace: 'nowrap' }}>{product.lastUpdated ? new Date(product.lastUpdated).toISOString().split('T')[0] : ''}</TableCell>
                    </TableRow>

                ))}
            </TableBody>
        </Table>
    )
}