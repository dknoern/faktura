"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { createVendorPayout } from "@/lib/actions/vendor-payment-actions";

export interface PayoutSummary {
    eligible: boolean;
    timeCount: number;
    expenseCount: number;
    timeHours: number;
    hourlyRate: number | null;
    timeAmount: number;
    expenseAmount: number;
    total: number;
    needsHourlyRate: boolean;
}

interface PayoutDialogProps {
    vendorId: string;
    vendorName: string;
    payout: PayoutSummary;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const fmt = (n: number) => `$${n.toFixed(2)}`;

export function PayoutDialog({ vendorId, vendorName, payout, open, onOpenChange }: PayoutDialogProps) {
    const router = useRouter();
    const [method, setMethod] = useState<'check' | 'venmo' | 'other'>('check');
    const [checkNumber, setCheckNumber] = useState('');
    const [note, setNote] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canSubmit = !payout.needsHourlyRate && !(method === 'check' && !checkNumber.trim());

    async function handleSubmit() {
        setError(null);
        if (method === 'check' && !checkNumber.trim()) {
            setError('Check number is required');
            return;
        }
        setIsSubmitting(true);
        try {
            const result = await createVendorPayout(vendorId, {
                method,
                checkNumber: method === 'check' ? checkNumber.trim() : undefined,
                note: note.trim() || undefined,
            });
            if (!result.success) {
                setError(result.error || 'Failed to complete payout');
                return;
            }
            toast.success(`Payout of ${fmt(result.data?.totalAmount ?? payout.total)} recorded`);
            onOpenChange(false);
            router.refresh();
        } catch (err) {
            console.error('Error completing payout:', err);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Payout to {vendorName}</DialogTitle>
                    <DialogDescription>
                        Pays all approved time and expense entries for this vendor and marks them as paid.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="rounded-md border p-4 space-y-2 text-sm">
                        {payout.timeCount > 0 && (
                            <div className="flex justify-between">
                                <span>
                                    {payout.timeCount} time {payout.timeCount === 1 ? 'entry' : 'entries'} — {payout.timeHours.toFixed(1)} hrs
                                    {payout.hourlyRate != null && ` × ${fmt(payout.hourlyRate)}/hr`}
                                </span>
                                <span>{payout.hourlyRate != null ? fmt(payout.timeAmount) : '—'}</span>
                            </div>
                        )}
                        {payout.expenseCount > 0 && (
                            <div className="flex justify-between">
                                <span>{payout.expenseCount} {payout.expenseCount === 1 ? 'expense' : 'expenses'}</span>
                                <span>{fmt(payout.expenseAmount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between border-t pt-2 font-semibold">
                            <span>Total payout</span>
                            <span>{payout.needsHourlyRate ? '—' : fmt(payout.total)}</span>
                        </div>
                    </div>

                    {payout.needsHourlyRate && (
                        <Alert variant="destructive">
                            <AlertDescription>
                                This vendor has approved time entries but no hourly rate. Set an hourly rate on the
                                vendor before paying out.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div>
                        <Label htmlFor="payout-method">Payment method</Label>
                        <Select value={method} onValueChange={(v) => setMethod(v as typeof method)}>
                            <SelectTrigger id="payout-method" className="mt-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="check">Check</SelectItem>
                                <SelectItem value="venmo">Venmo</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {method === 'check' && (
                        <div>
                            <Label htmlFor="payout-check-number">
                                Check number <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="payout-check-number"
                                className="mt-1"
                                value={checkNumber}
                                onChange={(e) => setCheckNumber(e.target.value)}
                                placeholder="e.g. 1042"
                            />
                        </div>
                    )}

                    <div>
                        <Label htmlFor="payout-note">Note</Label>
                        <Textarea
                            id="payout-note"
                            className="mt-1"
                            rows={2}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Optional note about this payout"
                        />
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !canSubmit}>
                        {isSubmitting ? "Recording..." : `Complete Payout${payout.needsHourlyRate ? '' : ` (${fmt(payout.total)})`}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
