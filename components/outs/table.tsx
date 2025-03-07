import { fetchOuts } from "@/lib/data";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import React from "react";

export async function OutsTable() {

    const logs = await fetchOuts();
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead style={{ whiteSpace: 'nowrap' }}>Sent To</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>By</TableHead>
                    <TableHead>Comments</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {logs.map((log) => {
                    return (
                        <TableRow key={log._id}>
                            <TableCell style={{ whiteSpace: 'nowrap' }}>{log.date ? new Date(log.date).toISOString().split('T')[0] : ''}</TableCell>
                            <TableCell> {log.sentTo}</TableCell>
                            <TableCell> {log.description}</TableCell>
                            <TableCell> {log.user}</TableCell>
                            <TableCell> {log.comments}</TableCell>
                        </TableRow>
                    )
                }
                )}
                </TableBody>
        </Table>
    )
}