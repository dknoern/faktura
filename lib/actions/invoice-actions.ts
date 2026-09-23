"use server"

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/dbConnect";
import { Invoice } from "@/lib/models/invoice";
import { Proposal } from "@/lib/models/proposal";
import { calcTax } from "@/lib/utils/tax";
import { updateProductHistory } from "@/lib/utils/product-history";
import { getShortUser } from "@/lib/auth-utils";
import { format } from "date-fns";
import { productModel } from "@/lib/models/product";
import { getNextCounter, getTenantObjectId } from "@/lib/tenant-utils";
import { getTenantId } from "@/lib/auth-utils";
import { ensureInvoicePaymentLink, deactivateInvoicePaymentLink } from "@/lib/stripe/payment-links";
import { getPaymentTotalsForInvoices } from "@/lib/actions/payment-actions";
import { loadTenantRequiredData } from "@/lib/tenant-required-data";

export interface LineItem {
  productId?: string;
  itemNumber?: string;
  name: string;
  amount: number;
  serialNumber?: string;
  longDesc?: string;
}

export interface InvoiceData {
  _id?: string;
  invoiceNumber?: number;
  customerId?: string;
  // Present when the invoice is created from a proposal
  proposalId?: string;
  customerNumber?: number;
  customerFirstName: string;
  customerLastName: string;
  customerEmail?: string;
  customerPhone?: string;
  date: string | Date;
  shipVia?: string;
  paidBy?: string;
  authNumber?: string;
  subtotal?: number;
  tax?: number;
  shipping?: number;
  total: number;
  methodOfSale?: string;
  salesPerson?: string;
  invoiceType?: string;
  shipToName?: string;
  shipAddress1?: string;
  shipAddress2?: string;
  shipAddress3?: string;
  shipCity?: string;
  shipState?: string;
  shipZip?: string;
  shipCountry?: string;
  billingAddress1?: string;
  billingAddress2?: string;
  billingAddress3?: string;
  billingCity?: string;
  billingState?: string;
  billingZip?: string;
  billingCountry?: string;
  copyAddress?: boolean;
  taxExempt?: boolean;
  lineItems: LineItem[];
  trackingNumber?: string;
}

export async function upsertInvoice(data: InvoiceData, id?: string) {
  try {
    await dbConnect();

    const tenantIdForValidation = await getTenantId();
    const requiredData = await loadTenantRequiredData(tenantIdForValidation);

    if (requiredData.salesPerson && !data.salesPerson?.trim()) {
      return { success: false, error: "Sales person is required." };
    }
    if (requiredData.customerPhone && !data.customerPhone?.trim()) {
      return { success: false, error: "Customer phone is required." };
    }
    if (requiredData.customerEmail && !data.customerEmail?.trim()) {
      return { success: false, error: "Customer email is required." };
    }
    if (requiredData.customerAddress && (!data.shipAddress1?.trim() || !data.shipCity?.trim() || !data.shipState?.trim() || !data.shipZip?.trim())) {
      return { success: false, error: "Shipping address (address line 1, city, state, and ZIP) is required." };
    }

    let invoiceNumber: number;
    let invoiceData: any;

    // Check if we're updating an existing invoice or creating a new one
    const isUpdate = id !== undefined;

    // When creating a new invoice, ensure all referenced products are eligible
    // (must be In Stock or Memo) before we allocate a new invoice number.
    if (!isUpdate) {
      const eligibleStatuses = new Set(["In Stock", "Memo"]);
      const productIds = (data.lineItems || [])
        .map((li) => li?.productId)
        .filter((pid): pid is string => typeof pid === 'string' && pid.trim() !== '');

      if (productIds.length > 0) {
        const tenantObjId = await getTenantObjectId();
        const products = await productModel
          .find({ _id: { $in: productIds }, tenantId: tenantObjId })
          .select({ status: 1, itemNumber: 1, title: 1 })
          .lean();

        const productsById = new Map(products.map((p: any) => [p._id.toString(), p]));

        for (const lineItem of data.lineItems || []) {
          if (!lineItem?.productId) continue;
          const product = productsById.get(lineItem.productId);

          if (!product) {
            return {
              success: false,
              error: `Cannot create invoice: product '${lineItem.itemNumber || lineItem.productId}' was not found`,
            };
          }

          const status = (product.status || "").toString();
          if (!eligibleStatuses.has(status)) {
            const label = product.itemNumber || lineItem.itemNumber || product.title || lineItem.productId;
            return {
              success: false,
              error: `Cannot create invoice: product '${label}' is '${status}'. Only 'In Stock' or 'Memo' items can be invoiced.`,
            };
          }
        }
      }
    }
    
    if (isUpdate) {
      const tenantObjectId = await getTenantObjectId();
      // Update existing invoice - fetch existing invoiceNumber
      const existing = await Invoice.findOne({ _id: id, tenantId: tenantObjectId, status: { $ne: 'Deleted' } }).select('invoiceNumber').lean();
      if (!existing) {
        return { success: false, error: 'Invoice not found' };
      }
      invoiceNumber = (existing as any).invoiceNumber || data.invoiceNumber || 0;
      invoiceData = {
        ...data,
        date: new Date(data.date)
      };
    } else {
      // Create new invoice
      // Generate a new invoice number using getNextCounter
      const newInvoiceNumber = await getNextCounter('invoiceNumber');
      
      invoiceNumber = newInvoiceNumber;
      const tenantObjectId = await getTenantObjectId();
      invoiceData = {
        ...data,
        invoiceNumber: invoiceNumber,
        tenantId: tenantObjectId,
        date: new Date(data.date)
      };
    }

    // `status` is system-owned (only deleteInvoice writes it) - a request
    // payload must never be able to set or clear the 'Deleted' marker.
    delete invoiceData.status;

    // Calculate tax
    try {
      const tenantIdForTax = await getTenantId();
      const calculatedTax = await calcTax(invoiceData as any, tenantIdForTax);
      invoiceData.tax = calculatedTax;
      invoiceData.total = (invoiceData.subtotal || 0) + (invoiceData.tax || 0) + (invoiceData.shipping || 0);
    } catch (taxError) {
      console.error('Tax calculation failed.');
      // Return the specific tax error to the frontend
      return {
        success: false,
        error: taxError instanceof Error ? taxError.message : 'Tax calculation failed'
      };
    }
    
    // Update item status to sold, but only if NOT Partner and NOT Estimate
    if (invoiceData.invoiceType !== "Partner" && invoiceData.invoiceType !== "Estimate") {
      let itemStatus = "Sold";
      let itemAction = "sold item";

      if ("Memo" === invoiceData.invoiceType) {
        itemStatus = "Memo";
        itemAction = "item memo";
      }

      const user = await getShortUser();
      // Use invoiceNumber as refDoc (resolved to _id on display)
      updateProductHistory(invoiceData.lineItems, itemStatus, itemAction, user, invoiceNumber.toString());
    }
    
    // Update search field
    invoiceData.search = buildSearchField(invoiceData);
    
    if (isUpdate) {
      // Update existing invoice
      const tenantObjForUpdate = await getTenantObjectId();
      await Invoice.findOneAndUpdate({ _id: id, tenantId: tenantObjForUpdate, status: { $ne: 'Deleted' } }, invoiceData);
    } else {
      // Create new invoice
      const invoice = new Invoice(invoiceData);
      await invoice.save();
    }
    
    // For new invoices, get the saved document's _id
    let savedId = id;
    if (!isUpdate) {
      const tenantObjForLookup = await getTenantObjectId();
      const saved = await Invoice.findOne({ invoiceNumber, tenantId: tenantObjForLookup }).select('_id').lean();
      savedId = saved ? (saved as any)._id.toString() : undefined;
    }

    // If the invoice was created from a proposal, move the proposal to
    // Invoiced (only from Draft/Sent/Accepted — never off a terminal status).
    // Best-effort: a failure here should not block the invoice save.
    if (!isUpdate && data.proposalId) {
      try {
        const tenantObjForProposal = await getTenantObjectId();
        await Proposal.updateOne(
          {
            _id: data.proposalId,
            tenantId: tenantObjForProposal,
            $or: [
              { status: { $in: ['Draft', 'Sent', 'Accepted'] } },
              { status: { $exists: false } },
              { status: null },
            ],
          },
          { $set: { status: 'Invoiced' } }
        );
        revalidatePath('/proposals');
      } catch (proposalError) {
        console.error('Failed to mark proposal as Invoiced:', proposalError);
      }
    }

    // Best-effort: create / refresh a Stripe Payment Link for this invoice.
    // Wrapped in try/catch so Stripe outages can never block invoice save.
    if (savedId) {
      try {
        const tenantId = await getTenantId();
        const tenantObjectId = await getTenantObjectId();
        const existing = await Invoice.findOne({ _id: savedId, tenantId: tenantObjectId })
          .select('_id invoiceNumber total subtotal tax shipping lineItems stripePaymentLink')
          .lean();
        if (existing) {
          const link = await ensureInvoicePaymentLink(existing as any, { _id: tenantObjectId }, tenantId);
          if (link) {
            await Invoice.updateOne(
              { _id: savedId, tenantId: tenantObjectId },
              { $set: { stripePaymentLink: link } }
            );
          }
        }
      } catch (stripeErr) {
        console.error(
          `[stripe] payment-link step failed for invoice ${savedId}: ${
            stripeErr instanceof Error ? stripeErr.message : String(stripeErr)
          }`
        );
      }
    }

    revalidatePath('/invoices');

    return { success: true, invoiceId: savedId, invoiceNumber };
  } catch (error) {
    console.error(`Error ${id ? 'updating' : 'creating'} invoice:`, error);
    return { 
      success: false, 
      error: `Failed to ${id ? 'update' : 'create'} invoice${id ? ': ' + (error instanceof Error ? error.message : String(error)) : ''}` 
    };
  }
}


export async function getInvoiceIdByNumber(invoiceNumber: number): Promise<string | null> {
  try {
    await dbConnect();
    const tenantObjectId = await getTenantObjectId();
    const invoice = await Invoice.findOne({ invoiceNumber, tenantId: tenantObjectId }).select('_id').lean();
    return invoice ? (invoice as any)._id.toString() : null;
  } catch (error) {
    console.error('Error looking up invoice by number:', error);
    return null;
  }
}

function formatUsd(amount: number){
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function buildSearchField(doc: any){

  var search = "";
  if(doc.invoiceNumber != null){
      search += doc.invoiceNumber.toString() + " ";
  }

  const formattedDate = format(doc.date instanceof Date ? doc.date : new Date(doc.date), 'yyyy-MM-dd');


  search += doc.customerFirstName + " " + doc.customerLastName + " " + formattedDate + " ";

  if (doc.lineItems != null) {
      for (var i = 0; i < doc.lineItems.length; i++) {
          if(doc.lineItems[i] != null){
              search += " " + doc.lineItems[i].itemNumber + " " + doc.lineItems[i].name;
          }
      }
  }
  return search;
}

/**
 * Soft-delete an invoice: marks it 'Deleted' (which hides it from every
 * invoice list, lookup, and sales report) and returns its line-item products
 * to inventory so they can be invoiced again.
 */
export async function deleteInvoice(id: string) {
  try {
    await dbConnect();
    const tenantObjectId = await getTenantObjectId();

    const invoice = await Invoice.findOne({
      _id: id,
      tenantId: tenantObjectId,
      status: { $ne: 'Deleted' },
    })
      .select('invoiceNumber invoiceType lineItems stripePaymentLink')
      .lean();

    if (!invoice) {
      return { success: false, error: 'Invoice not found', code: 'not_found' as const };
    }

    // A paid invoice is a money record: deleting it would orphan its Payment
    // documents, which are only ever queried per-invoice and would become
    // invisible. Remove the payments first if the invoice really must go.
    const totals = await getPaymentTotalsForInvoices([id]);
    const totalPaid = totals[id] ?? 0;
    if (totalPaid > 0) {
      return {
        success: false,
        error: `Cannot delete this invoice: ${formatUsd(totalPaid)} in payments has been recorded against it. Remove the payments first.`,
        code: 'has_payments' as const,
      };
    }

    const user = await getShortUser();

    await Invoice.updateOne(
      { _id: id, tenantId: tenantObjectId },
      {
        $set: {
          status: 'Deleted',
          deletedAt: new Date(),
          deletedBy: user,
          lastUpdated: new Date(),
        },
      }
    );

    // Creating an invoice marks its items Sold/Memo (except Partner and
    // Estimate, which never touch product status), so deleting one puts those
    // items back in stock. Otherwise upsertInvoice would refuse to re-invoice
    // them, stranding the inventory.
    const { invoiceType, lineItems, invoiceNumber } = invoice as any;
    if (invoiceType !== 'Partner' && invoiceType !== 'Estimate') {
      await updateProductHistory(
        lineItems,
        'In Stock',
        'invoice deleted',
        user,
        invoiceNumber?.toString()
      );
    }

    // Best-effort: kill the Stripe Payment Link so a deleted invoice can't
    // still be paid. Wrapped so a Stripe outage can never fail the delete.
    if ((invoice as any).stripePaymentLink?.id) {
      try {
        const tenantId = await getTenantId();
        await deactivateInvoicePaymentLink(invoice as any, tenantId);
        await Invoice.updateOne(
          { _id: id, tenantId: tenantObjectId },
          { $unset: { stripePaymentLink: "" } }
        );
      } catch (stripeErr) {
        console.error(
          `[stripe] failed to deactivate payment link for deleted invoice ${id}: ${
            stripeErr instanceof Error ? stripeErr.message : String(stripeErr)
          }`
        );
      }
    }

    revalidatePath('/invoices');
    revalidatePath('/inventory');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return {
      success: false,
      error: `Failed to delete invoice: ${error instanceof Error ? error.message : String(error)}`,
      code: 'error' as const,
    };
  }
}
