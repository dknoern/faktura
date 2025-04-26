"use server"

import { revalidatePath } from "next/cache";
import dbConnect from "./dbConnect";
import { Invoice } from "./models/invoice";
import { Counter } from "./models/counter";

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

export async function createInvoice(data: InvoiceData) {
  try {
    await dbConnect();
    
    // Generate a new invoice number using Counter
    const newInvoiceNumber = await Counter.findByIdAndUpdate(
      { _id: 'invoiceNumber' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    
    // Ensure date is a Date object and add the ID
    const invoiceData = {
      ...data,
      _id: newInvoiceNumber.seq,
      date: new Date(data.date),
      // Generate search field for better search functionality
      search: `${data.customerFirstName} ${data.customerLastName} ${data.invoiceNo || ''}`
    };
    
    // Create the invoice
    const invoice = new Invoice(invoiceData);
    await invoice.save();
    
    revalidatePath('/dashboard/invoices');
    // Return only the ID of the created invoice to avoid circular references
    return { success: true, invoiceId: newInvoiceNumber.seq };
  } catch (error) {
    console.error("Error creating invoice:", error);
    return { success: false, error: "Failed to create invoice" };
  }
}

export async function updateInvoice(id: number, data: InvoiceData) {
  try {
    await dbConnect();
    
    // Ensure date is a Date object and update search field
    const invoiceData = {
      ...data,
      date: new Date(data.date),
      search: `${data.customerFirstName} ${data.customerLastName} ${data.invoiceNo || ''}`
    };
    
    // Update the invoice
    await Invoice.findByIdAndUpdate(id, invoiceData);
    
    revalidatePath('/dashboard/invoices');
    return { success: true, invoiceId: id };
  } catch (error) {
    console.error("Error updating invoice:", error);
    return { success: false, error: "Failed to update invoice" };
  }
}
