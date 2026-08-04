"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, PlusCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { deletePayment, type PaymentRecord } from "@/lib/actions/payment-actions";
import { formatCurrency } from "@/lib/invoice-renderer";

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  check: "Check",
  credit_card: "Credit Card",
  ach: "ACH",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  });

interface PaymentsSectionProps {
  initialPayments: PaymentRecord[];
  invoiceTotal: number;
  onOpenRecordPayment: () => void;
}

export function PaymentsSection({
  initialPayments,
  invoiceTotal,
  onOpenRecordPayment,
}: PaymentsSectionProps) {
  const [payments, setPayments] = useState<PaymentRecord[]>(initialPayments);
  const [deleting, setDeleting] = useState<string | null>(null);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = invoiceTotal - totalPaid;

  async function handleDelete(paymentId: string) {
    setDeleting(paymentId);
    try {
      const result = await deletePayment(paymentId);
      if (!result.success) {
        toast.error(result.error ?? "Failed to delete payment");
        return;
      }
      setPayments((prev) => prev.filter((p) => p._id !== paymentId));
      toast.success("Payment removed");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="mt-8 border-t pt-6" id="payments">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">Payments</h2>
        <Button size="sm" variant="outline" onClick={onOpenRecordPayment}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      </div>

      {payments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No payments recorded.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p._id}>
                  <TableCell className="text-sm">{formatDate(p.date)}</TableCell>
                  <TableCell className="text-sm">{METHOD_LABELS[p.method] ?? p.method}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.notes ?? "—"}</TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {formatCurrency(p.amount)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      disabled={deleting === p._id}
                      onClick={() => handleDelete(p._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex justify-end mt-3">
        <div className="w-72 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-right flex-1 mr-4 text-muted-foreground">TOTAL PAID:</span>
            <span className="w-24 text-right font-medium">{formatCurrency(totalPaid)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span className="text-right flex-1 mr-4">BALANCE DUE:</span>
            <span className={`w-24 text-right ${balance < 0 ? "text-green-600" : balance === 0 ? "text-green-600" : ""}`}>
              {formatCurrency(balance)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export type { PaymentRecord };
