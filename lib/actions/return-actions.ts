"use server"

import mongoose from "mongoose";
import { Return } from "@/lib/models/return";
import dbConnect from "@/lib/dbConnect";
import { getShortUser } from "@/lib/auth-utils";
import { format } from "date-fns";
import { updateProductHistory } from "@/lib/utils/product-history";
import { getNextCounter, getTenantObjectId } from "@/lib/tenant-utils";

type ReturnData = {
  _id?: string;
  returnNumber?: number;
  customerName: string;
  customerId?: string;
  customerNumber?: number;
  invoiceId: string;
  invoiceNumber?: number;
  returnDate: string;
  subTotal: number;
  taxable: boolean;
  salesTax: number;
  shipping: number;
  totalReturnAmount: number;
  salesPerson?: string;
  lineItems: {
    productId?: string;
    itemNumber: string;
    name?: string;
    amount: number;
    serialNo?: string;
    longDesc?: string;
    included: boolean;
  }[];
};

function formatDate(date: string | null) {
  if (date == null) return "";
  else {
    return format(new Date(date), 'yyyy-MM-dd');
  }
}

export async function createReturn(data: ReturnData) {
  try {
    await dbConnect();

    // Get the next return number from the counter collection (tenant-scoped)
    const returnNumber = await getNextCounter('returnNumber');

    const tenantObjectId = await getTenantObjectId();
    // Clean the data to avoid any potential circular references or undefined values
    const cleanData = {
      returnNumber: returnNumber,
      customerName: data.customerName || '',
      customerId: data.customerId || undefined,
      customerNumber: data.customerNumber || undefined,
      invoiceId: data.invoiceId ? new mongoose.Types.ObjectId(data.invoiceId) : undefined,
      invoiceNumber: data.invoiceNumber || undefined,
      tenantId: tenantObjectId,
      returnDate: new Date(),
      subTotal: Number(data.subTotal) || 0,
      taxable: Boolean(data.taxable),
      salesTax: Number(data.salesTax) || 0,
      shipping: Number(data.shipping) || 0,
      totalReturnAmount: Number(data.totalReturnAmount) || 0,
      salesPerson: data.salesPerson || undefined,
      lineItems: (data.lineItems || []).map(item => ({
        productId: item.productId || undefined,
        itemNumber: item.itemNumber || '',
        name: item.name || '',
        amount: Number(item.amount) || 0,
        serialNo: item.serialNo || undefined,
        longDesc: item.longDesc || undefined,
        included: Boolean(item.included)
      })),
      search: returnNumber + " " + data.invoiceId + " " + formatDate(data.returnDate) + " " + data.customerName + " " + data.salesPerson + " " + data.totalReturnAmount,
    };

    // Create a new return document with the cleaned data
    const returnDoc = new Return(cleanData);

    await returnDoc.save();

    // Update product history for returned items
    const user = await getShortUser();
    const refDoc = returnDoc._id.toString();
    const action = 'item returned';
    const status = 'In Stock';

    await updateProductHistory(cleanData.lineItems, status, action, user, refDoc);

    return { success: true, data: JSON.parse(JSON.stringify(returnDoc)) };
  } catch (error: any) {
    console.error("Error creating return:", error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
}

export async function updateReturn(returnId: string, data: ReturnData) {
  try {
    await dbConnect();

    // Create a clean data object without _id to prevent schema conflicts
    const updateData = { ...data };
    const tenantObjectId = await getTenantObjectId();
    const updatedReturn = await Return.findOneAndUpdate(
      { _id: returnId, tenantId: tenantObjectId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedReturn) {
      throw new Error(`Return with ID ${returnId} not found`);
    }

    // Update product history for returned items
    const user = await getShortUser();
    const refDoc = returnId;
    const action = 'return';
    const status = 'In Stock';

    await updateProductHistory(data.lineItems || [], status, action, user, refDoc);

    return { success: true, data: JSON.parse(JSON.stringify(updatedReturn)) };
  } catch (error) {
    console.error("Error updating return:", error);
    throw error;
  }
}

/**
 * Check if a return exists for a specific invoice ID
 * @param invoiceId The invoice ID to check
 * @returns Object with returnId if found, null if not found
 */
export async function checkReturnByInvoiceId(invoiceId: string) {
  try {
    await dbConnect();

    const tenantObjectId = await getTenantObjectId();
    const returnItem = await Return.findOne({ invoiceId: new mongoose.Types.ObjectId(invoiceId), tenantId: tenantObjectId });

    if (returnItem) {
      return { returnId: returnItem._id };
    } else {
      return { returnId: null };
    }
  } catch (error) {
    console.error("Error checking for return:", error);
    throw error;
  }
}
