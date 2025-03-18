import { fetchNewestCustomers } from "@/lib/data";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { LinkTableCell } from "../LinkTableCell";

export async function CustomersTable() {

    const latestCustomers = await fetchNewestCustomers();
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Company</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {latestCustomers.map((customer) => (
                    <TableRow key={customer._id}>
                        <LinkTableCell href={`/dashboard/customers/${customer._id}/edit`}>{customer._id}</LinkTableCell>
                        <TableCell> {customer.firstName + ' ' + customer.lastName}</TableCell>
                        <TableCell>{customer.city}</TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell> {customer.phone}</TableCell>
                        <TableCell> {customer.company}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}