"use server"

import { revalidatePath } from "next/cache";
import dbConnect from "./dbConnect";
import { Invoice } from "./models/invoice";
import { Counter } from "./models/counter";
import { calcTax } from "./utils/tax";
import { updateProductHistory } from "./utils/product-history";
import { getShortUserFromToken } from "./auth-utils";
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
    const calculatedTax = await calcTax(invoiceData as any);
    invoiceData.tax = calculatedTax;
    invoiceData.total = (invoiceData.subtotal || 0) + (invoiceData.tax || 0) + (invoiceData.shipping || 0);
    
    // Update item status to sold, but only if NOT Partner and NOT Estimate
    if (invoiceData.invoiceType !== "Partner" && invoiceData.invoiceType !== "Estimate") {
      let itemStatus = "Sold";
      let itemAction = "sold item";

      if ("Memo" === invoiceData.invoiceType) {
        itemStatus = "Memo";
        itemAction = "item memo";
      }

      const user = await getShortUserFromToken();
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
    
    revalidatePath('/dashboard/invoices');
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

  const formattedDate = format(doc.date, 'yyyy-MM-dd');


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
