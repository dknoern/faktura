import type Stripe from "stripe";
import { getStripeForTenant } from "./client";

export interface StripePaymentLinkRecord {
  url: string;
  id: string;
  amount: number;
  currency: string;
  createdAt: Date;
}

interface InvoiceLineItemLike {
  name?: string;
  itemNumber?: string;
  serialNumber?: string;
  longDesc?: string;
  amount?: number;
}

interface InvoiceLike {
  _id: any;
  invoiceNumber?: number;
  total?: number;
  subtotal?: number;
  tax?: number;
  shipping?: number;
  lineItems?: InvoiceLineItemLike[];
  stripePaymentLink?: { id?: string; amount?: number; currency?: string } | null;
}

interface TenantLike {
  _id?: any;
}

const CURRENCY = "usd";
const STRIPE_MAX_LINE_ITEMS = 20;

function toCents(amount: number): number {
  return Math.round(amount * 100);
}

type StripeLineItem = Stripe.PaymentLinkCreateParams.LineItem;

function buildLineItems(
  invoice: InvoiceLike,
  totalInCents: number
): StripeLineItem[] {
  const fallback: StripeLineItem[] = [
    {
      quantity: 1,
      price_data: {
        currency: CURRENCY,
        unit_amount: totalInCents,
        product_data: {
          name: invoice.invoiceNumber
            ? `Invoice #${invoice.invoiceNumber}`
            : `Invoice ${invoice._id}`,
        },
      },
    },
  ];

  const items: StripeLineItem[] = [];
  for (const li of invoice.lineItems ?? []) {
    const cents = toCents(li.amount ?? 0);
    if (cents <= 0) return fallback; // discounts / freebies aren't representable
    const namePieces = [li.name?.trim() || li.itemNumber || "Item"];
    if (li.itemNumber && li.name && li.name.trim() !== li.itemNumber) {
      namePieces[0] = `${li.itemNumber} - ${li.name.trim()}`;
    }
    const productName = namePieces[0].slice(0, 250); // Stripe product name limit
    const metadata: Record<string, string> = {};
    if (li.itemNumber) metadata.item_number = li.itemNumber.slice(0, 500);
    if (li.serialNumber) metadata.serial_number = li.serialNumber.slice(0, 500);

    items.push({
      quantity: 1,
      price_data: {
        currency: CURRENCY,
        unit_amount: cents,
        product_data: {
          name: productName,
          ...(Object.keys(metadata).length ? { metadata } : {}),
        },
      },
    });
  }

  const taxCents = toCents(invoice.tax ?? 0);
  if (taxCents > 0) {
    items.push({
      quantity: 1,
      price_data: {
        currency: CURRENCY,
        unit_amount: taxCents,
        product_data: { name: "Tax" },
      },
    });
  }

  const shippingCents = toCents(invoice.shipping ?? 0);
  if (shippingCents > 0) {
    items.push({
      quantity: 1,
      price_data: {
        currency: CURRENCY,
        unit_amount: shippingCents,
        product_data: { name: "Shipping" },
      },
    });
  }

  if (items.length === 0 || items.length > STRIPE_MAX_LINE_ITEMS) return fallback;

  const sum = items.reduce(
    (acc, it) => acc + ((it.price_data as any)?.unit_amount ?? 0),
    0
  );
  if (sum !== totalInCents) return fallback;

  return items;
}

/**
 * Create (or skip) a Stripe Payment Link for the given invoice. Returns the
 * fields to persist on the invoice when a new link was created, or `null`
 * when the existing link is still valid or Stripe is not configured for the
 * tenant. Never throws - errors are logged and swallowed.
 */
export async function ensureInvoicePaymentLink(
  invoice: InvoiceLike,
  tenant: TenantLike,
  tenantId: string
): Promise<StripePaymentLinkRecord | null> {
  const invoiceId = invoice._id?.toString?.() ?? String(invoice._id);
  const total = invoice.total ?? 0;
  if (total <= 0) return null;

  const amountInCents = toCents(total);

  if (
    invoice.stripePaymentLink &&
    invoice.stripePaymentLink.amount === amountInCents &&
    (invoice.stripePaymentLink.currency || CURRENCY) === CURRENCY
  ) {
    return null;
  }

  let stripe: Stripe | null;
  try {
    stripe = await getStripeForTenant(tenantId);
  } catch (err) {
    console.error(
      `[stripe] payment-link: getStripeForTenant failed for tenant ${tenantId}: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    return null;
  }

  if (!stripe) return null;

  const idempotencyKey = `pl-${invoiceId}-${amountInCents}-${CURRENCY}`;
  const lineItems = buildLineItems(invoice, amountInCents);

  const previousLinkId = invoice.stripePaymentLink?.id;

  try {
    const link = await stripe.paymentLinks.create(
      {
        line_items: lineItems,
        metadata: {
          invoice_id: invoiceId,
          ...(invoice.invoiceNumber ? { invoice_number: String(invoice.invoiceNumber) } : {}),
          tenant_id: tenantId,
        },
      },
      { idempotencyKey }
    );

    // Best-effort: deactivate the prior link so it can't still be paid. Failure
    // here is non-fatal - the new link is already created and persisted.
    if (previousLinkId && previousLinkId !== link.id) {
      try {
        await stripe.paymentLinks.update(previousLinkId, { active: false });
      } catch (archiveErr: any) {
        const code = archiveErr?.code || archiveErr?.type || "unknown";
        const msg = archiveErr?.message || String(archiveErr);
        console.error(
          `[stripe] payment-link: failed to deactivate prior link ${previousLinkId} for invoice ${invoiceId} [${code}]: ${msg}`
        );
      }
    }

    return {
      url: link.url,
      id: link.id,
      amount: amountInCents,
      currency: CURRENCY,
      createdAt: new Date(),
    };
  } catch (err: any) {
    const code = err?.code || err?.type || "unknown";
    const msg = err?.message || String(err);
    console.error(
      `[stripe] payment-link: create failed for invoice ${invoiceId} (tenant ${tenantId}) [${code}]: ${msg}`
    );
    return null;
  }
}
