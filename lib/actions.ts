"use server"

import { Repair } from "./models/repair";
import { Return } from "./models/return";
import { productModel } from "./models/product";
import dbConnect from "./dbConnect";
import { getShortUserFromToken } from "./auth-utils";
import { format } from "date-fns";
import { Counter } from "./models/counter";

export type State = {
  errors?: {
    id?: string[];
    title?: string[];
    seller?: string[];
    itemNumber?: string[];
    productType?: string[];
  };
  message?: string | null;
};

function formatDate(date: string | null) {
  if (date == null) return "";
  else {
      return format(new Date(date), 'yyyy-MM-dd');
  }
}

export async function createRepair(formData: FormData) {
  try {
    await dbConnect();

    // Handle repair cost - convert to number only if it has a value
    const repairCostStr = formData.get("repairCost") as string;
    const repairCost = repairCostStr && repairCostStr.trim() !== '' ? 
      parseFloat(repairCostStr) : undefined;

    const productId = formData.get("selectedProductId");
    const customerId = formData.get("selectedCustomerId");

    const repair = new Repair({
      repairNumber: formData.get("repairNumber"),
      itemNumber: formData.get("itemNumber"),
      description: formData.get("description"),
      dateOut: new Date(),
      customerApprovedDate: formData.get("customerApprovedDate") || null,
      returnDate: formData.get("returnDate") || null,
      customerFirstName: formData.get("customerFirstName"),
      customerLastName: formData.get("customerLastName"),
      vendor: formData.get("vendor"),
      repairCost: repairCost,
      repairIssues: formData.get("repairIssues"),
      repairNotes: formData.get("repairNotes"),
      warrantyService: formData.get("warrantyService") === 'true',
      email: formData.get("email"),
      phone: formData.get("phone"),
      itemId: productId,
      customerId: customerId,
    });

    console.log('dateOut', repair.dateOut);
    console.log('returnDate', repair.returnDate);
    
    repair.search = repair.repairNumber 
    + " " + repair.itemNumber 
    + " " + repair.description 
    + " " + formatDate(repair.dateOut)
    + " " + formatDate(repair.returnDate)
    + " " + repair.customerFirstName 
    + " " + repair.customerLastName 
    + " " + repair.vendor;


    console.log("creating this repair", repair);

    await repair.save();

    // update product, set status to "In Repair", also add history item with date, and action= "repair"

    const user = await getShortUserFromToken();

    if (productId != null && productId != '') {
      await productModel.findOneAndUpdate({
        _id: productId,
        status: { $ne: "Repair" }
      }, {
        "$push": {
          "history": {
            user: user,
            date: Date.now(),
            action: "in repair",
            refDoc: repair._id
          }
        },
        "$set": {
          "status": "Repair",
          "lastUpdated": new Date()
        }
      }, {
        upsert: false, useFindAndModify: false
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error creating repair:", error);
    throw error;
  }
}

export async function updateRepair(repairNumber: string, formData: FormData) {
  try {
    await dbConnect();
    
    // Handle repair cost - convert to number only if it has a value
    const repairCostStr = formData.get("repairCost") as string;
    const repairCost = repairCostStr && repairCostStr.trim() !== '' ? 
      parseFloat(repairCostStr) : undefined;
    
    const updateData = {
      itemNumber: formData.get("itemNumber"),
      description: formData.get("description"),
      dateOut: formData.get("dateOut") || null,
      customerApprovedDate: formData.get("customerApprovedDate") || null,
      returnDate: formData.get("returnDate") || null,
      customerFirstName: formData.get("customerFirstName"),
      customerLastName: formData.get("customerLastName"),
      vendor: formData.get("vendor"),
      repairCost: repairCost,
      repairIssues: formData.get("repairIssues") || '',
      repairNotes: formData.get("repairNotes") || '',
      warrantyService: formData.get("warrantyService") === 'true',
      email: formData.get("email") || '',
      phone: formData.get("phone") || ''
    };

    await Repair.findOneAndUpdate({ repairNumber }, updateData);
    return { success: true };
  } catch (error) {
    console.error("Error updating repair:", error);
    throw error;
  }
}

type ReturnData = {
  _id?: number;
  customerName: string;
  customerId?: number;
  invoiceId: string;
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

export async function createReturn(data: ReturnData) {
  try {
    await dbConnect();
    
    // Get the next return number from the counter collection
    const newReturnNumber = await Counter.findByIdAndUpdate(
      { _id: 'returnNumber' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    
    // Create a new return document with the generated ID
    const returnDoc = new Return({
      ...data,
      _id: newReturnNumber.seq
    });
    
    await returnDoc.save();
    
    return { success: true, data: returnDoc };
  } catch (error) {
    console.error("Error creating return:", error);
    throw error;
  }
}

export async function updateReturn(returnId: number, data: ReturnData) {
  try {
    await dbConnect();
    
    // Create a clean data object without _id to prevent schema conflicts
    const updateData = { ...data };
    const updatedReturn = await Return.findByIdAndUpdate(
      returnId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedReturn) {
      throw new Error(`Return with ID ${returnId} not found`);
    }
    
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
    
    const returnItem = await Return.findOne({ invoiceId });
    
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
