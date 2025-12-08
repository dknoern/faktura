"use server"

import { Repair } from "./models/repair";
import { Return } from "./models/return";
import { productModel } from "./models/product";
import dbConnect from "./dbConnect";
import { getShortUser } from "./auth-utils";
import { format } from "date-fns";
import { Counter } from "./models/counter";
import { updateProductHistory } from "./utils/product-history";
import { createTrelloRepairCard } from "./trello-api";

// Helper function to get next repair number
async function getNextRepairNumber(): Promise<string> {
  try {
    const counter = await Counter.findByIdAndUpdate(
      'repairNumber',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    return counter.seq.toString();
  } catch (error) {
    console.error("Error getting next repair number:", error);
    throw error;
  }
}

// Helper function to build search field for repairs
function buildRepairSearchField(repairData: {
  repairNumber?: string;
  itemNumber?: string;
  description?: string;
  dateOut?: Date | string | null;
  returnDate?: Date | string | null;
  customerFirstName?: string;
  customerLastName?: string;
  vendor?: string;
}): string {
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, "MM/dd/yyyy");
    } catch {
      return '';
    }
  };

  return [
    repairData.repairNumber || '',
    repairData.itemNumber || '',
    repairData.description || '',
    formatDate(repairData.dateOut),
    formatDate(repairData.returnDate),
    repairData.customerFirstName || '',
    repairData.customerLastName || '',
    repairData.vendor || ''
  ].join(' ').trim();
}

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

    // Get repair number from form or generate new one if blank
    let repairNumber = formData.get("repairNumber") as string;
    if (!repairNumber || repairNumber.trim() === '') {
      console.log('repairNumber is blank, generating new one')
      repairNumber = await getNextRepairNumber();
      console.log('new repairNumber', repairNumber)
    } else {
      console.log('repairNumber is not blank, checking if it is a valid number')
      // get current value of repairNumber seq from Counter
      const counter = await Counter.findOne({ _id: 'repairNumber' });
      const counterValue = counter?.seq;
      console.log('current counter value', counterValue)

      // also check if entered repairNumber is already used
      if (Number(repairNumber) < 50000) {
        const repairExists = await Repair.findOne({ repairNumber });
        if (repairExists) {
          return {
            success: false,
            error: `Repair number ${repairNumber} already exists. Please use a different number or leave blank to generate a new one.`
          };
        }
      }

      // if repairNumber is a number and less than 50000 but more than the counter value, set the counter value to repairNumber
      // check that repaiarNumber can be parsed as a number
      console.log('checking if repairNumber is a number and less than 50000 but more than the counter value')
      if (Number(repairNumber) < 50000 && Number(repairNumber) > counterValue) {
        console.log('repairNumber is a number and less than 50000 but more than the counter value, updating counter')
        await Counter.findOneAndUpdate({ _id: 'repairNumber' }, { seq: repairNumber });
      }
    }

    const repair = new Repair({
      repairNumber: repairNumber,
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

    repair.search = buildRepairSearchField(repair);


    console.log("creating this repair", repair);

    await repair.save();

    // update product, set status to "In Repair", also add history item with date, and action= "repair"

    const user = await getShortUser();

    if (productId != null && productId != '') {
      await productModel.findOneAndUpdate({
        _id: productId,
        status: { $ne: "Repair" }
      }, {
        "$push": {
          "history": {
            user: user,
            date: Date.now(),
            action: "in repair - " + repair.vendor,
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

    // Create Trello card for the repair only if itemNumber is not set
    if (!repair.itemNumber || repair.itemNumber.trim() === '') {
      try {
        const trelloCardData = {
          repairNumber: repair.repairNumber,
          repairId: repair._id.toString(),
          customerFirstName: repair.customerFirstName,
          customerLastName: repair.customerLastName,
          customerEmail: repair.email,
          customerPhone: repair.phone,
          brand: '',
          material: '',
          description: repair.description,
          itemValue: undefined,
          repairOptions: {
            service: repair.warrantyService || false,
            polish: false,
            batteryChange: false,
            other: true
          },
          user: user,
          repairNotes: repair.repairNotes || repair.repairIssues || ''
        };

        const trelloResult = await createTrelloRepairCard(trelloCardData);

        if (trelloResult.success) {
          console.log(`✓ Trello card created for repair #${repair.repairNumber}`);
        } else {
          console.error(`✗ Failed to create Trello card for repair #${repair.repairNumber}: ${trelloResult.error}`);
        }
      } catch (error) {
        console.error('Error creating Trello card:', error);
        // Don't fail the repair creation if Trello fails
      }
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
    console.log('updating repair (server)', repairNumber, formData);

    // Handle repair cost - convert to number only if it has a value
    const repairCostStr = formData.get("repairCost") as string;
    const repairCost = repairCostStr && repairCostStr.trim() !== '' ?
      parseFloat(repairCostStr) : undefined;

    // Get the current repair to access repairNumber for search field
    const repairId = formData.get("repairId");
    const currentRepair = await Repair.findById(repairId);

    const updateData: any = {
      itemNumber: formData.get("itemNumber") as string,
      description: formData.get("description") as string,
      // dateOut should not be updated - it's set once when the repair is created
      customerApprovedDate: formData.get("customerApprovedDate") || null,
      returnDate: formData.get("returnDate") || null,
      customerFirstName: formData.get("customerFirstName") as string,
      customerLastName: formData.get("customerLastName") as string,
      vendor: formData.get("vendor") as string,
      repairCost: repairCost,
      repairIssues: formData.get("repairIssues") || '',
      repairNotes: formData.get("repairNotes") || '',
      warrantyService: formData.get("warrantyService") === 'true',
      email: formData.get("email") || '',
      phone: formData.get("phone") || ''
    };

    if (currentRepair) {
      // Build updated search field
      updateData.search = buildRepairSearchField({
        repairNumber: currentRepair.repairNumber,
        itemNumber: updateData.itemNumber,
        description: updateData.description,
        dateOut: updateData.dateOut,
        returnDate: updateData.returnDate,
        customerFirstName: updateData.customerFirstName,
        customerLastName: updateData.customerLastName,
        vendor: updateData.vendor
      });
    }

    await Repair.findByIdAndUpdate(repairId, updateData);
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

    // Get the default tenant (for now, assuming we have a way to get it or pass it)
    // For this refactor, we'll fetch the default tenant if not provided
    // TODO: Pass tenantId from context/auth
    const { fetchDefaultTenant } = await import("./data");
    const defaultTenant = await fetchDefaultTenant();
    if (!defaultTenant) throw new Error("Default tenant not found");
    const tenantId = defaultTenant._id;

    // Get the next return number from the tenant counter
    const { getNextSequence } = await import("./utils/tenant-utils");
    const returnNumber = await getNextSequence(tenantId, 'return');

    // Clean the data to avoid any potential circular references or undefined values
    const cleanData = {
      returnNumber: returnNumber,
      tenant: tenantId,
      customerName: data.customerName || '',
      customerId: data.customerId || undefined,
      invoiceId: data.invoiceId || '',
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
    const refDoc = returnNumber.toString();
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
    const updatedReturn = await Return.findByIdAndUpdate(
      returnId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedReturn) {
      throw new Error(`Return with ID ${returnId} not found`);
    }

    // Update product history for returned items
    const user = await getShortUser();
    const refDoc = returnId.toString();
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
