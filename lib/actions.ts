"use server"

import { Repair } from "./models/repair";
import { Return } from "./models/return";
import dbConnect from "./dbConnect";


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


export async function createRepair(formData: FormData) {
  try {
    await dbConnect();
    
    // Handle repair cost - convert to number only if it has a value
    const repairCostStr = formData.get("repairCost") as string;
    const repairCost = repairCostStr && repairCostStr.trim() !== '' ? 
      parseFloat(repairCostStr) : undefined;
    
    const repair = new Repair({
      repairNumber: formData.get("repairNumber"),
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
    });

    await repair.save();
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
    
    const returnDoc = new Return(data);
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
