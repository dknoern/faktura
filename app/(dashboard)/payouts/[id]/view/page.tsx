import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Paperclip, Clock, Receipt } from "lucide-react";
import Link from "next/link";
import { notFound } from 'next/navigation';
import { fetchVendorPaymentById, fetchEntriesByPaymentId, fetchTenant } from "@/lib/data";

export const dynamic = 'force-dynamic';

const METHOD_LABELS: Record<string, string> = {
  check: 'Check',
  venmo: 'Venmo',
  other: 'Other',
};

const fmt = (n: number) => `$${n.toFixed(2)}`;

export default async function ViewPayoutPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;

  const tenant = await fetchTenant();
  if (tenant?.features?.time !== true) {
    notFound();
  }

  const payment = await fetchVendorPaymentById(id);
  if (!payment) {
    notFound();
  }

  const entries = await fetchEntriesByPaymentId(payment._id.toString());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payout #{payment.payoutNumber}</h1>
        {payment.vendorName && (
          <p className="text-lg text-muted-foreground mt-1">
            <Link href={`/vendors/${payment.vendorId}/view`} className="hover:underline">
              {payment.vendorName}
            </Link>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Date</label>
              <p className="text-sm">
                {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : ''}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Method</label>
              <div className="mt-1">
                <Badge variant="secondary">
                  {METHOD_LABELS[payment.method] ?? payment.method}
                  {payment.checkNumber ? ` #${payment.checkNumber}` : ''}
                </Badge>
              </div>
            </div>
            {payment.paidBy && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Paid By</label>
                <p className="text-sm">{payment.paidBy}</p>
              </div>
            )}
            {payment.note && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Note</label>
                <p className="text-sm whitespace-pre-wrap">{payment.note}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Amounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {payment.timeAmount != null && (
              <div className="flex justify-between">
                <span>
                  Time — {payment.timeHours?.toFixed(1)} hrs
                  {payment.hourlyRate != null && ` × ${fmt(payment.hourlyRate)}/hr`}
                </span>
                <span>{fmt(payment.timeAmount)}</span>
              </div>
            )}
            {payment.expenseAmount != null && (
              <div className="flex justify-between">
                <span>Expenses</span>
                <span>{fmt(payment.expenseAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Total</span>
              <span>{fmt(payment.totalAmount)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">
          Entries Paid ({entries.length})
        </h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="text-right">Hours</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry: any) => (
              <TableRow key={entry._id}>
                <TableCell>{entry.date}</TableCell>
                <TableCell>
                  {entry.entryType === 'expense' ? (
                    <Badge variant="secondary">
                      <Receipt className="mr-1 h-3 w-3" />
                      Expense
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <Clock className="mr-1 h-3 w-3" />
                      Time
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{entry.projectName}</TableCell>
                <TableCell className="max-w-[300px]">
                  {entry.description && (
                    <div className="truncate font-medium" title={entry.description}>
                      {entry.description}
                    </div>
                  )}
                  {entry.comment && (
                    <div className="truncate text-muted-foreground text-sm" title={entry.comment}>
                      {entry.comment}
                    </div>
                  )}
                  {entry.receipt && (
                    <a
                      href={`/api/time/receipt?entryId=${entry._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      <Paperclip className="h-3 w-3" />
                      Receipt
                    </a>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {entry.hours != null ? entry.hours.toFixed(1) : ''}
                </TableCell>
                <TableCell className="text-right">
                  {entry.amount != null ? fmt(entry.amount) : ''}
                </TableCell>
              </TableRow>
            ))}
            {entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No entries reference this payout
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
