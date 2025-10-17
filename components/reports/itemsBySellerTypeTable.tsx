import { getProductsForSellerType } from "@/lib/reports";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export async function ItemsBySellerTypeTable(props: { sellerType: string; }) {

    const products = await getProductsForSellerType(props.sellerType);
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead style={{ whiteSpace: 'nowrap' }}>Partner</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead style={{ whiteSpace: 'nowrap' }}>Item #</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead >Our Price</TableHead>
                    <TableHead>Cost</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {products.map((product) => (
                    <TableRow key={product._id}>
                        <TableCell>{product.seller}</TableCell>
                        <TableCell style={{ whiteSpace: 'nowrap' }}>{product.lastUpdated ? new Date(product.lastUpdated).toISOString().split('T')[0] : ''}</TableCell>
                        <TableCell>{product.itemNumber}</TableCell>
                        <TableCell>{product.title}</TableCell>
                        <TableCell style={{ textAlign: 'right' }}>{Math.ceil(product.cost ?? 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' }).replace('.00','')}</TableCell>
                        <TableCell style={{ textAlign: 'right' }}>{Math.ceil(product.sellingPrice ?? 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' }).replace('.00','')}</TableCell>
                        
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}