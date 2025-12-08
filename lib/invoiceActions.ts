"use server"

import { revalidatePath } from "next/cache";
import dbConnect from "./dbConnect";
import { Invoice } from "./models/invoice";
import { Counter } from "./models/counter";
import { calcTax } from "./utils/tax";
import { updateProductHistory } from "./utils/product-history";
import { getShortUser } from "./auth-utils";
import { format } from "date-fns";

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
  invoiceNo?: string;
  customerId?: number;
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
  status?: string;
}

export async function upsertInvoice(data: InvoiceData, id?: string) {
  try {
    await dbConnect();

    let invoiceId: string | undefined;
    let invoiceData: any;

    // Check if we're updating an existing invoice or creating a new one
    const isUpdate = id !== undefined;

    if (isUpdate) {
      // Update existing invoice
      // invoiceId = id; // We don't need to set invoiceId for update if we are using _id to find
      invoiceData = {
        ...data,
        date: new Date(data.date)
      };
    } else {
      // Create new invoice
      // Generate a new invoice number using Counter
      // Get the default tenant
      const { fetchDefaultTenant } = await import("./data");
      const defaultTenant = await fetchDefaultTenant();
      if (!defaultTenant) throw new Error("Default tenant not found");
      const tenantId = defaultTenant._id;

      // Generate a new invoice number using TenantCounter
      const { getNextSequence } = await import("./utils/tenant-utils");
      const newInvoiceNumber = await getNextSequence(tenantId, 'invoice');

      // invoiceId = newInvoiceNumber; // We want to return the _id (string), not the number
      invoiceData = {
        ...data,
        invoiceNumber: invoiceId,
        tenant: tenantId,
        date: new Date(data.date)
      };
    }

    // Calculate tax
    try {
      const calculatedTax = await calcTax(invoiceData as any);
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
      // Use the invoice ID for product history
      const invoiceIdString = invoiceData.invoiceNumber ? invoiceData.invoiceNumber.toString() : '';
      updateProductHistory(invoiceData.lineItems, itemStatus, itemAction, user, invoiceIdString);
    }

    // Update search field
    invoiceData.search = buildSearchField(invoiceData);

    if (isUpdate) {
      // Update existing invoice
      await Invoice.findByIdAndUpdate(id, invoiceData);
      invoiceId = id;
    } else {
      // Create new invoice
      const invoice = new Invoice(invoiceData);
      await invoice.save();
      invoiceId = invoice._id.toString();
    }

    revalidatePath('/invoices');
    return { success: true, invoiceId };
  } catch (error) {
    console.error(`Error ${id ? 'updating' : 'creating'} invoice:`, error);
    return {
      success: false,
      error: `Failed to ${id ? 'update' : 'create'} invoice${id ? ': ' + (error instanceof Error ? error.message : String(error)) : ''}`
    };
  }
}


function buildSearchField(doc: InvoiceData) {

  var search = "";
  if (doc.invoiceNumber != null) {
    search += doc.invoiceNumber.toString() + " ";
  }

  const formattedDate = format(doc.date, 'yyyy-MM-dd');


  search += doc.customerFirstName + " " + doc.customerLastName + " " + formattedDate + " ";

  if (doc.lineItems != null) {
    for (var i = 0; i < doc.lineItems.length; i++) {
      if (doc.lineItems[i] != null) {
        search += " " + doc.lineItems[i].itemNumber + " " + doc.lineItems[i].name;
      }
    }
  }
  return search;
}
