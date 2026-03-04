"use server"

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/dbConnect";
import { Invoice } from "@/lib/models/invoice";
import { calcTax } from "@/lib/utils/tax";
import { updateProductHistory } from "@/lib/utils/product-history";
import { getShortUser } from "@/lib/auth-utils";
import { format } from "date-fns";
import { productModel } from "@/lib/models/product";
import { getNextCounter, getTenantObjectId } from "@/lib/tenant-utils";

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
  status?: string;
}

export async function upsertInvoice(data: InvoiceData, id?: string) {
  try {
    await dbConnect();
    
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
      const existing = await Invoice.findOne({ _id: id, tenantId: tenantObjectId }).select('invoiceNumber').lean();
      invoiceNumber = (existing as any)?.invoiceNumber || data.invoiceNumber || 0;
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
      // Use invoiceNumber as refDoc (resolved to _id on display)
      updateProductHistory(invoiceData.lineItems, itemStatus, itemAction, user, invoiceNumber.toString());
    }
    
    // Update search field
    invoiceData.search = buildSearchField(invoiceData);
    
    if (isUpdate) {
      // Update existing invoice
      const tenantObjForUpdate = await getTenantObjectId();
      await Invoice.findOneAndUpdate({ _id: id, tenantId: tenantObjForUpdate }, invoiceData);
    } else {
      // Create new invoice
      const invoice = new Invoice(invoiceData);
      await invoice.save();
    }
    
    revalidatePath('/invoices');
    
    // For new invoices, get the saved document's _id
    let savedId = id;
    if (!isUpdate) {
      const saved = await Invoice.findOne({ invoiceNumber }).select('_id').lean();
      savedId = saved ? (saved as any)._id.toString() : undefined;
    }
    
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
