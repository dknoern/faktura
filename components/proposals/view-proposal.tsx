"use client";

import * as React from "react";
import { Proposal } from "@/lib/proposal-renderer";
import { ProposalActionMenu } from "./proposal-action-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

export function ViewProposal({ proposal }: { proposal: Proposal }) {
    const customerName = `${proposal.customerFirstName} ${proposal.customerLastName}`.trim();

    return (
        <div className="container mx-auto px-8">
            <div className="bg-white p-8 rounded-lg shadow">

                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                    <div>
                        <h1 className="text-2xl font-semibold" style={{ color: '#B69D57' }}>Proposal</h1>
                        <p className="text-sm font-bold mt-1">{formatDate(proposal.date)}</p>
                    </div>
                    <ProposalActionMenu proposal={proposal} />
                </div>

                {/* Client Info & Status */}
                <div className="flex gap-24 mb-6">
                    <div>
                        <p className="text-sm font-bold">Client Information</p>
                        <p className="text-sm">{customerName}</p>
                    </div>
                    {proposal.status && (
                        <div>
                            <p className="text-sm font-bold">Status</p>
                            <p className="text-sm">{proposal.status}</p>
                        </div>
                    )}
                </div>

                {/* Line Items Table */}
                <div className="rounded-md border mb-6">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="font-bold">Item</TableHead>
                                <TableHead className="text-right font-bold w-[100px]">Price</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {proposal.lineItems.length > 0 ? (
                                proposal.lineItems.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="py-3 text-sm">
                                            {item.longDesc || item.name}
                                        </TableCell>
                                        <TableCell className="text-right py-3 font-medium text-sm">
                                            {formatCurrency(item.amount)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                                        No line items
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Total */}
                <div className="flex justify-end mb-6">
                    <div className="flex justify-between w-48 font-bold text-base border-t pt-2">
                        <span>Total:</span>
                        <span>{formatCurrency(proposal.total)}</span>
                    </div>
                </div>

            </div>
        </div>
    );
}
