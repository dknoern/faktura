import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import dbConnect from "@/lib/dbConnect";
import { getStripeForTenant, getWebhookSecretForTenant } from "@/lib/stripe/client";
import { Invoice } from "@/lib/models/invoice";
import { Payment } from "@/lib/models/payment";
import mongoose from "mongoose";

// Must be called before any body parsing — Next.js App Router gives us
// a Web API Request so we use request.text() to preserve the raw bytes
// that Stripe uses for signature verification.
export const dynamic = "force-dynamic";

function stripeMethodToPaymentMethod(
  session: Stripe.Checkout.Session
): "cash" | "check" | "credit_card" | "ach" {
  const types = session.payment_method_types ?? [];
  if (types.includes("us_bank_account")) return "ach";
  return "credit_card";
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  tenantId: string
): Promise<void> {
  // Only handle sessions that originated from a Payment Link
  if (!session.payment_link) {
    console.log(`[stripe-webhook] session ${session.id} has no payment_link, skipping`);
    return;
  }

  if (session.payment_status !== "paid") {
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

  // Find the invoice by its Stripe Payment Link ID
  const invoice = await Invoice.findOne({
    tenantId: tenantObjectId,
    "stripePaymentLink.id": session.payment_link,
  }).lean();

  if (!invoice) {
    console.log(
      `[stripe-webhook] no invoice found for payment_link ${session.payment_link} (tenant ${tenantId})`
    );
    return;
  }

  const amountDollars = (session.amount_total ?? 0) / 100;
  const paymentDate = new Date(session.created * 1000);
  const method = stripeMethodToPaymentMethod(session);

  await Payment.create({
    tenantId: tenantObjectId,
    invoiceId: (invoice as any)._id,
    date: paymentDate,
    amount: amountDollars,
    method,
    notes: `Stripe Payment Link — session ${session.id}`,
    stripeSessionId: session.id,
  });

  console.log(
    `[stripe-webhook] recorded payment $${amountDollars} for invoice ${(invoice as any)._id} (session ${session.id})`
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

  // Load the tenant's Stripe client (used only to get the SDK instance for constructEvent)
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
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
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
