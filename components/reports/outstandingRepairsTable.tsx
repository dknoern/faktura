import { getOutstandingRepairs } from "@/lib/reports";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export async function OutstandingRepairsTable() {

    const repairs = await getOutstandingRepairs("all");
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead style={{ whiteSpace: 'nowrap' }}>Repair # </TableHead>
                    <TableHead style={{ whiteSpace: 'nowrap' }}>Item #</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead style={{ whiteSpace: 'nowrap' }}>Date Out</TableHead>
  
                </TableRow>
            </TableHeader>
            <TableBody>
                {repairs.map((repair) => (
                    <TableRow key={repair._id}>
                        <TableCell>{repair.repairNumber}</TableCell>
                        <TableCell>{repair.itemNumber}</TableCell>
                        <TableCell>{repair.vendor}</TableCell>
                        <TableCell>{repair.description}</TableCell>
                        <TableCell style={{ whiteSpace: 'nowrap' }}>{repair.dateOut ? new Date(repair.dateOut).toISOString().split('T')[0] : ''}</TableCell>

                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}