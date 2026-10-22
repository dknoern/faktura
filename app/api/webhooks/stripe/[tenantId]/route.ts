import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import dbConnect from "@/lib/dbConnect";
import { getStripeForTenant, getWebhookSecretForTenant } from "@/lib/stripe/client";
import { resolvePaymentMethod } from "@/lib/stripe/payment-method";
import { Invoice } from "@/lib/models/invoice";
import { Payment } from "@/lib/models/payment";
import mongoose from "mongoose";

// Must be called before any body parsing — Next.js App Router gives us
// a Web API Request so we use request.text() to preserve the raw bytes
// that Stripe uses for signature verification.
export const dynamic = "force-dynamic";

/** Find the invoice a Payment Link session belongs to, or null. */
async function findInvoiceForSession(
  session: Stripe.Checkout.Session,
  tenantObjectId: mongoose.Types.ObjectId
) {
  return Invoice.findOne({
    tenantId: tenantObjectId,
    "stripePaymentLink.id": session.payment_link,
  }).lean();
}

/**
 * Record a settled payment. Handles both `checkout.session.completed` (card —
 * settles immediately) and `checkout.session.async_payment_succeeded` (ACH and
 * other delayed-notification methods, which settle days after checkout).
 *
 * `paidAt` is the event timestamp rather than `session.created`: for ACH the
 * session is created at checkout but the money does not arrive until the debit
 * clears, so the session's creation time would backdate the payment by days.
 */
async function handlePaymentSucceeded(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
  tenantId: string,
  paidAt: Date
): Promise<void> {
  // Only handle sessions that originated from a Payment Link
  if (!session.payment_link) {
    console.log(`[stripe-webhook] session ${session.id} has no payment_link, skipping`);
    return;
  }

  if (session.payment_status !== "paid") {
    // Expected for ACH on `checkout.session.completed`: the debit has been
    // submitted but not settled. `async_payment_succeeded` follows days later.
    console.log(`[stripe-webhook] session ${session.id} payment_status=${session.payment_status}, skipping`);
    return;
  }

  await dbConnect();
  const tenantObjectId = new mongoose.Types.ObjectId(tenantId);

  // Idempotency: skip if we already recorded this checkout session
  const existing = await Payment.findOne({ stripeSessionId: session.id }).lean();
  if (existing) {
    console.log(`[stripe-webhook] session ${session.id} already recorded, skipping`);
    return;
  }

  const invoice = await findInvoiceForSession(session, tenantObjectId);

  if (!invoice) {
    console.log(
      `[stripe-webhook] no invoice found for payment_link ${session.payment_link} (tenant ${tenantId})`
    );
    return;
  }

  const amountDollars = (session.amount_total ?? 0) / 100;
  const method = await resolvePaymentMethod(stripe, session);

  await Payment.create({
    tenantId: tenantObjectId,
    invoiceId: (invoice as any)._id,
    date: paidAt,
    amount: amountDollars,
    method,
    notes: `Stripe Payment Link — session ${session.id}`,
    stripeSessionId: session.id,
  });

  console.log(
    `[stripe-webhook] recorded ${method} payment $${amountDollars} for invoice ${(invoice as any)._id} (session ${session.id})`
  );
}

/**
 * A delayed-notification payment (ACH) failed to settle — e.g. insufficient
 * funds or a closed account. No Payment was ever recorded, so there is nothing
 * to reverse; this exists so the failure is visible rather than silent.
 */
async function handleAsyncPaymentFailed(
  session: Stripe.Checkout.Session,
  tenantId: string
): Promise<void> {
  if (!session.payment_link) return;

  await dbConnect();
  const tenantObjectId = new mongoose.Types.ObjectId(tenantId);
  const invoice = await findInvoiceForSession(session, tenantObjectId);

  const amountDollars = (session.amount_total ?? 0) / 100;
  const invoiceRef = invoice
    ? `invoice ${(invoice as any)._id} (#${(invoice as any).invoiceNumber ?? "?"})`
    : `payment_link ${session.payment_link}`;

  console.error(
    `[stripe-webhook] ACH payment FAILED to settle for ${invoiceRef}: $${amountDollars}, ` +
      `session ${session.id} (tenant ${tenantId}). Invoice remains unpaid — follow up with the customer.`
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;

  // Read raw body BEFORE any parsing for Stripe signature verification
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  // Load the tenant's webhook secret
  const webhookSecret = await getWebhookSecretForTenant(tenantId);
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook not configured for this tenant" },
      { status: 400 }
    );
  }

  // Load the tenant's Stripe client (used for constructEvent and for resolving
  // the payment method behind a session)
  const stripe = await getStripeForTenant(tenantId);
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe not configured for this tenant" },
      { status: 400 }
    );
  }

  // Verify the webhook signature
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error(`[stripe-webhook] signature verification failed for tenant ${tenantId}: ${err.message}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Dispatch event
  try {
    switch (event.type) {
      // Cards settle immediately and arrive here already `paid`. ACH arrives
      // here `unpaid` and is skipped, then returns as async_payment_succeeded.
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await handlePaymentSucceeded(
          stripe,
          event.data.object as Stripe.Checkout.Session,
          tenantId,
          new Date(event.created * 1000)
        );
        break;
      case "checkout.session.async_payment_failed":
        await handleAsyncPaymentFailed(
          event.data.object as Stripe.Checkout.Session,
          tenantId
        );
        break;
      default:
        // Acknowledged but not acted on
        break;
    }
  } catch (err: any) {
    console.error(`[stripe-webhook] error handling event ${event.type} for tenant ${tenantId}:`, err);
    // Return 500 so Stripe will retry
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
