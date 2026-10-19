import { payouts } from "@paypal/payouts-sdk";
import { getPaypalClientForTenant } from "./client";

export interface SendVenmoPayoutInput {
  phone: string;
  amount: number;
  note?: string;
  // Deterministic, derived from vendorId + unpaid entry ids + amount by the
  // caller. PayPal rejects a sender_batch_id reused within 30 days (HTTP 422),
  // which is exactly what makes retries after a network blip safe here: the
  // same inputs always produce the same id, so a retry either lands once or
  // is recognized by PayPal as the original attempt.
  senderBatchId: string;
}

export interface SendPayoutResult {
  success: boolean;
  payoutBatchId?: string;
  payoutItemId?: string;
  transactionStatus?: string;
  error?: string;
}

function parsePaypalErrorBody(message: string | undefined): any {
  if (!message) return null;
  try {
    return JSON.parse(message);
  } catch {
    return null;
  }
}

// PayPal's top-level error "message" (e.g. "Invalid request - see details") is
// a generic category label - the actual cause lives in details[], each with
// its own field/issue/description. Surface those too, or every validation
// failure looks identical.
function formatPaypalError(body: any, fallback: string): string {
  const details: any[] = Array.isArray(body?.details) ? body.details : [];
  if (details.length === 0) {
    return body?.message || fallback;
  }
  const detailText = details
    .map((d) => [d?.field, d?.issue, d?.description].filter(Boolean).join(": "))
    .filter(Boolean)
    .join("; ");
  return detailText ? `${body?.message || fallback} (${detailText})` : (body?.message || fallback);
}

// PayPal rejects a reused sender_batch_id with an error whose body links back
// to the original batch. Best-effort extraction of that batch id so a retry
// (e.g. after a timeout) can recover the original result instead of surfacing
// a confusing "duplicate" error to the admin. If PayPal's exact error shape
// doesn't match what's handled here, this simply falls through to returning
// the original error - verify against a sandbox duplicate-batch response
// before relying on this path.
function extractBatchIdFromDuplicateError(body: any): string | null {
  const links: any[] = body?.links || body?.details?.[0]?.links || [];
  for (const link of links) {
    const match = typeof link?.href === "string" && link.href.match(/\/payouts\/([^/?]+)/);
    if (match) return match[1];
  }
  return null;
}

async function recoverDuplicateBatch(
  tenantId: string,
  payoutBatchId: string
): Promise<SendPayoutResult> {
  const client = await getPaypalClientForTenant(tenantId);
  if (!client) return { success: false, error: "PayPal is not configured for this tenant" };

  try {
    const request = new payouts.PayoutsGetRequest(payoutBatchId);
    const response = await client.execute(request);
    const item = response.result?.items?.[0];
    return {
      success: true,
      payoutBatchId: response.result?.batch_header?.payout_batch_id,
      payoutItemId: item?.payout_item_id,
      transactionStatus: item?.transaction_status || response.result?.batch_header?.batch_status,
    };
  } catch (err) {
    console.error(
      `[paypal] Failed to recover duplicate batch ${payoutBatchId} for tenant ${tenantId}: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    return { success: false, error: "Payout was already submitted, but its status could not be retrieved. Check PayPal directly." };
  }
}

export async function sendVenmoPayout(
  tenantId: string,
  input: SendVenmoPayoutInput
): Promise<SendPayoutResult> {
  const client = await getPaypalClientForTenant(tenantId);
  if (!client) {
    return { success: false, error: "PayPal is not configured for this tenant" };
  }

  const request = new payouts.PayoutsPostRequest();
  request.requestBody({
    sender_batch_header: {
      sender_batch_id: input.senderBatchId,
      email_subject: "You have a payout!",
    },
    items: [
      {
        recipient_type: "PHONE",
        recipient_wallet: "Venmo",
        receiver: input.phone,
        amount: {
          value: input.amount.toFixed(2),
          currency: "USD",
        },
        note: input.note || "Vendor payout",
        sender_item_id: input.senderBatchId,
      },
    ],
  });

  try {
    const response = await client.execute(request);
    const item = response.result?.items?.[0];
    return {
      success: true,
      payoutBatchId: response.result?.batch_header?.payout_batch_id,
      payoutItemId: item?.payout_item_id,
      transactionStatus: item?.transaction_status || response.result?.batch_header?.batch_status,
    };
  } catch (err: any) {
    const body = parsePaypalErrorBody(err?.message);
    const isDuplicateBatch =
      err?.statusCode === 422 &&
      typeof body?.name === "string" &&
      body.name.toUpperCase().includes("DUPLICATE");

    if (isDuplicateBatch) {
      const existingBatchId = extractBatchIdFromDuplicateError(body);
      if (existingBatchId) {
        return recoverDuplicateBatch(tenantId, existingBatchId);
      }
    }

    const message = formatPaypalError(body, err?.message || "PayPal payout failed");
    console.error(
      `[paypal] Venmo payout failed for tenant ${tenantId} (status ${err?.statusCode}): ${message}`,
      body ? JSON.stringify(body) : err?.message
    );
    return { success: false, error: message };
  }
}

export async function getPayoutItemStatus(
  tenantId: string,
  payoutItemId: string
): Promise<{ status?: string; error?: string }> {
  const client = await getPaypalClientForTenant(tenantId);
  if (!client) {
    return { error: "PayPal is not configured for this tenant" };
  }

  try {
    const request = new payouts.PayoutsItemGetRequest(payoutItemId);
    const response = await client.execute(request);
    return { status: response.result?.transaction_status };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[paypal] Failed to fetch payout item ${payoutItemId} for tenant ${tenantId}: ${message}`);
    return { error: "Failed to check PayPal status" };
  }
}
