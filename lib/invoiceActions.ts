"use server"

import { revalidatePath } from "next/cache";
import dbConnect from "./dbConnect";
import { Invoice } from "./models/invoice";
import { Counter } from "./models/counter";
import { calcTax } from "./utils/tax";
import { updateProductHistory } from "./utils/product-history";
import { getShortUser } from "./auth-utils";
import { format } from "date-fns";
import { productModel } from "./models/product";

export interface LineItem {
  productId?: string;
  itemNumber?: string;
  name: string;
  amount: number;
  serialNumber?: string;
  longDesc?: string;
}

export interface InvoiceData {
  _id?: number;
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

export async function upsertInvoice(data: InvoiceData, id?: number) {
  try {
    await dbConnect();
    
    let invoiceId: number;
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
        const products = await productModel
          .find({ _id: { $in: productIds } })
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
      // Update existing invoice
      invoiceId = id;
      invoiceData = {
        ...data,
        date: new Date(data.date)
      };
    } else {
      // Create new invoice
      // Generate a new invoice number using Counter
      const newInvoiceNumber = await Counter.findByIdAndUpdate(
        { _id: 'invoiceNumber' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      
      invoiceId = newInvoiceNumber.seq;
      invoiceData = {
        ...data,
        _id: invoiceId,
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
      const invoiceIdString = invoiceData._id ? invoiceData._id.toString() : '';
      updateProductHistory(invoiceData.lineItems, itemStatus, itemAction, user, invoiceIdString);
    }
    
    // Update search field
    invoiceData.search = buildSearchField(invoiceData);
    
    if (isUpdate) {
      // Update existing invoice
      await Invoice.findByIdAndUpdate(id, invoiceData);
    } else {
      // Create new invoice
      const invoice = new Invoice(invoiceData);
      await invoice.save();
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


function buildSearchField(doc: InvoiceData){

  var search = "";
  if(doc._id != null){
      search += doc._id.toString() + " ";
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
