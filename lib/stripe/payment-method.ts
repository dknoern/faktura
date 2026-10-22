import type Stripe from "stripe";

export type PaymentMethod = "cash" | "check" | "credit_card" | "ach";

/**
 * Resolve how the customer actually paid for a Checkout Session.
 *
 * `session.payment_method_types` lists the methods *allowed* on the session,
 * not the one used — with automatic payment methods enabled that includes
 * `us_bank_account` on every session, which mislabels card payments as ACH.
 * The authoritative source is the charge behind the PaymentIntent.
 *
 * Shared by the webhook handler and the backfill script so the two can never
 * disagree about what a given session was paid with.
 */
export async function resolvePaymentMethod(
  stripe: Stripe,
  session: Stripe.Checkout.Session
): Promise<PaymentMethod> {
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  if (paymentIntentId) {
    try {
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ["latest_charge"],
      });
      const charge = intent.latest_charge as Stripe.Charge | null;
      const type = charge?.payment_method_details?.type;

      if (type === "us_bank_account") return "ach";
      // `link` and `card_present` are card-backed.
      if (type === "card" || type === "link" || type === "card_present") {
        return "credit_card";
      }
      if (type) {
        console.warn(
          `[stripe] session ${session.id}: unmapped payment_method_details.type=${type}, recording as credit_card`
        );
        return "credit_card";
      }
    } catch (err: any) {
      console.error(
        `[stripe] session ${session.id}: could not retrieve payment intent ${paymentIntentId}: ${
          err?.message || err
        }`
      );
    }
  }

  // Fallback: only trust the allow-list when it leaves no ambiguity.
  const types = session.payment_method_types ?? [];
  if (types.length === 1 && types[0] === "us_bank_account") return "ach";
  return "credit_card";
}
