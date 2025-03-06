import { fetchRepairs } from "@/lib/data";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export async function RepairsTable() {

    const repairs = await fetchRepairs();
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead style={{ whiteSpace: 'nowrap' }}>Repair</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Out</TableHead>
                    <TableHead>Approved</TableHead>
                    <TableHead>Returned</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Cost</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {repairs.map((repair) => (
                    <TableRow key={repair.repairNumber}>
                        <TableCell>{repair.repairNumber}</TableCell>
                        <TableCell>{repair.itemNumber}</TableCell>
                        <TableCell>{repair.description}</TableCell>
                        <TableCell style={{ whiteSpace: 'nowrap' }}>{repair.dateOut ? new Date(repair.dateOut).toISOString().split('T')[0] : ''}</TableCell>
                        <TableCell style={{ whiteSpace: 'nowrap' }}>{repair.customerApprovedDate ? new Date(repair.customerApprovedDate).toISOString().split('T')[0] : ''}</TableCell>
                        <TableCell style={{ whiteSpace: 'nowrap' }}>{repair.returnDate ? new Date(repair.returnDate).toISOString().split('T')[0] : ''}</TableCell>
                        <TableCell style={{ whiteSpace: 'nowrap' }}>{repair.customerFirstName + ' ' + repair.customerLastName}</TableCell>
                        <TableCell style={{ whiteSpace: 'nowrap' }}>{repair.vendor}</TableCell>
                        <TableCell>{repair.repairCost}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}