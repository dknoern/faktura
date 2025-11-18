import { getCustomers } from "@/lib/reports";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export async function CustomersTable() {

    const customers = await getCustomers();
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead style={{ whiteSpace: 'nowrap' }}>Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Company</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {customers.map((customer) => (
                    <TableRow key={customer._id}>
                        <TableCell>{customer._id}</TableCell>
                        <TableCell>{customer.firstName + ' ' + customer.lastName}</TableCell>
                        <TableCell>{customer.city}</TableCell>
                        <TableCell>{customer.emails?.[0]?.email || ''}</TableCell>
                        <TableCell>{customer.phones?.[0]?.phone || ''}</TableCell>
                        <TableCell>{customer.company}</TableCell>
                     </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}