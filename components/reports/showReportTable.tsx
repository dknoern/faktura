import { getShowReport } from "@/lib/reports";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export async function ShowReportTable() {
    
    const products = await getShowReport();
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead style={{ whiteSpace: 'nowrap' }}>Item #</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Retail Price</TableHead>
                    <TableHead>Selling Price</TableHead>
                    <TableHead>Serial</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {products.map((product) => (
                    <TableRow key={product._id}>
                        <TableCell>{product.itemNumber}</TableCell>
                        <TableCell>{product.title}</TableCell>
                        <TableCell style={{ textAlign: 'right' }}>{Math.ceil(product.cost).toLocaleString('en-US', { style: 'currency', currency: 'USD' }).replace('.00','')}</TableCell>
                        <TableCell style={{ textAlign: 'right' }}>{Math.ceil(product.listPrice).toLocaleString('en-US', { style: 'currency', currency: 'USD' }).replace('.00','')}</TableCell>
                        <TableCell style={{ textAlign: 'right' }}>{Math.ceil(product.sellingPrice).toLocaleString('en-US', { style: 'currency', currency: 'USD' }).replace('.00','')}</TableCell>
                        <TableCell>{product.serialNumber}</TableCell>
                     </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}