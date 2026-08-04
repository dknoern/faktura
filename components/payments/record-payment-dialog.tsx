"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";
import { createPayment, type PaymentRecord } from "@/lib/actions/payment-actions";

const METHODS = [
  { value: "cash", label: "Cash" },
  { value: "check", label: "Check" },
  { value: "credit_card", label: "Credit Card" },
  { value: "ach", label: "ACH" },
] as const;

interface RecordPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
  onSuccess: (payment: PaymentRecord) => void;
}

export function RecordPaymentDialog({
  open,
  onClose,
  invoiceId,
  onSuccess,
}: RecordPaymentDialogProps) {
  const today = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(today);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"cash" | "check" | "credit_card" | "ach">("cash");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleOpenChange = (val: boolean) => {
    if (!val && !saving) {
      resetForm();
      onClose();
      document.body.style.pointerEvents = "";
    }
  };

  function resetForm() {
    setDate(today);
    setAmount("");
    setMethod("cash");
    setNotes("");
  }

  async function handleSave() {
    const parsedAmount = parseFloat(amount);
    if (!date) { toast.error("Date is required"); return; }
    if (isNaN(parsedAmount) || parsedAmount <= 0) { toast.error("Enter a valid amount"); return; }

    setSaving(true);
    try {
      const result = await createPayment({
        invoiceId,
        date,
        amount: parsedAmount,
        method,
        notes: notes.trim() || undefined,
      });

      if (!result.success || !result.payment) {
        toast.error(result.error ?? "Failed to record payment");
        return;
      }

      toast.success("Payment recorded");
      onSuccess(result.payment);
      resetForm();
      onClose();
      document.body.style.pointerEvents = "";
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="pay-date">Date</Label>
            <Input
              id="pay-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pay-amount">Amount</Label>
            <Input
              id="pay-amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pay-method">Method</Label>
            <Select
              value={method}
              onValueChange={(v) => setMethod(v as typeof method)}
              disabled={saving}
            >
              <SelectTrigger id="pay-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pay-notes">Notes (optional)</Label>
            <Textarea
              id="pay-notes"
              placeholder="Check number, reference, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={saving}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Record Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
