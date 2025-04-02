import { fetchLogs } from "@/lib/data";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,

} from "@/components/ui/table"
import { LinkTableCell } from "../LinkTableCell";
import React from "react";

export async function LogsTable() {

    const logs = await fetchLogs();
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead style={{ whiteSpace: 'nowrap' }}>Received From</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Item Received</TableHead>
                    <TableHead style={{ whiteSpace: 'nowrap' }}>Item #</TableHead>
                    <TableHead style={{ whiteSpace: 'nowrap' }}>Repair #</TableHead>
                    <TableHead>By</TableHead>
                    <TableHead>Comments</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {logs.map((log) => {

                    let itemNumbers = ''
                    let itemNames = ''
                    let repairNumbers = ''
                    if (log.lineItems != null) {

                        itemNumbers = log.lineItems.map((lineItem: { itemNumber: string; }) => lineItem.itemNumber).join('<br/>')
                        itemNames = log.lineItems.map((lineItem: { name: string; }) => lineItem.name).join('<br/>')
                        repairNumbers = log.lineItems.map((lineItem: { repairNumber: string; }) => lineItem.repairNumber).join('<br/>')

                    }

                    return (
                        <TableRow key={log._id}>





                            <LinkTableCell  style={{ whiteSpace: 'nowrap' }} href={`/dashboard/loginitems/${log._id}/edit`}>{log.date ? new Date(log.date).toISOString().split('T')[0] : ''}</LinkTableCell>
                            <TableCell> {log.receivedFrom}</TableCell>
                            <TableCell> {log.customerName}</TableCell>

                            <TableCell>
                                {itemNames.split("<br/>").map((line, index, array) => (
                                    <React.Fragment key={index}>
                                        {line}
                                        {index < array.length - 1 && <br />}
                                    </React.Fragment>
                                ))}
                            </TableCell>
                            <TableCell>
                                {itemNumbers.split("<br/>").map((line, index, array) => (
                                    <React.Fragment key={index}>
                                        {line}
                                        {index < array.length - 1 && <br />}
                                    </React.Fragment>
                                ))}
                            </TableCell>

                            <TableCell>
                                {repairNumbers.split("<br/>").map((line, index, array) => (
                                    <React.Fragment key={index}>
                                        {line}
                                        {index < array.length - 1 && <br />}
                                    </React.Fragment>
                                ))}
                            </TableCell>
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