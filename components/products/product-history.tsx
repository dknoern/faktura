"use client"

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface HistoryEvent {
  date: string;
  user: string;
  action: string;
  refDoc?: string;
}

interface ProductHistoryProps {
  history: HistoryEvent[];
}

export function ProductHistory({ history }: ProductHistoryProps) {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No history available for this product.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {history.map((historyEvent, index) => (
          <TableRow key={index}>
            <TableCell>{new Date(historyEvent.date).toISOString().split('T')[0]}</TableCell>
            <TableCell className="font-medium">{historyEvent.user}</TableCell>
            <TableCell>
              {historyEvent.action}
              {historyEvent.action === "sold item" ? (
                <span> - <Link style={{ color: 'blue', cursor: 'pointer' }} href={`/invoices/${historyEvent.refDoc}/view`}>
                  {historyEvent.refDoc}
                </Link></span>
              ) : historyEvent.action === "received" && historyEvent.refDoc ? (
                <span> - <Link style={{ color: 'blue', cursor: 'pointer' }} href={`/loginitems/${historyEvent.refDoc}/edit`}>
                  {historyEvent.refDoc}
                </Link></span>
              ) : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
