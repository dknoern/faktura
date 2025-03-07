import { getReturnsSummary } from "@/lib/reports";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export async function ReturnsSummaryTable() {

    const returns = await getReturnsSummary(2025,2);
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead style={{ whiteSpace: 'nowrap' }}>Item #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead style={{ whiteSpace: 'nowrap' }}>Returned From</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {returns.map((ret) => (
                    <TableRow key={ret._id}>
                        <TableCell>{ret._id}</TableCell>
                        <TableCell style={{ whiteSpace: 'nowrap' }}>{ret.returnDate ? new Date(ret.returnDate).toISOString().split('T')[0] : ''}</TableCell>
                        <TableCell>{ret.customerName}</TableCell>
                     </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}