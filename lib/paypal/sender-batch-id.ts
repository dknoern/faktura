import { createHash } from "crypto";

// Deterministic so a retry after an ambiguous failure (timeout, etc.) reuses
// the same PayPal sender_batch_id rather than risking a double payout -
// PayPal rejects a sender_batch_id reused within 30 days (HTTP 422), which is
// what makes this safe: a retry either lands once or is recognized as the
// original attempt. See lib/paypal/payouts.ts for the recovery path.
export function derivePayoutBatchId(vendorId: string, entryIds: string[], totalAmount: number): string {
  const sorted = [...entryIds].sort();
  const hash = createHash("sha256")
    .update(`${vendorId}:${sorted.join(",")}:${totalAmount.toFixed(2)}`)
    .digest("hex")
    .slice(0, 24);
  return `vp-${hash}`;
}
