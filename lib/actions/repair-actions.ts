"use server"

import mongoose from "mongoose";
import { Repair } from "@/lib/models/repair";
import { productModel } from "@/lib/models/product";
import dbConnect from "@/lib/dbConnect";
import { getShortUser } from "@/lib/auth-utils";
import { updateProductHistory } from "@/lib/utils/product-history";
import { createTrelloRepairCard } from "@/lib/trello-api";
import { revalidatePath } from "next/cache";
import { buildRepairSearchField } from "@/lib/utils/repair-search";
import { getNextCounter, getCurrentCounter, setCounter, getTenantObjectId } from "@/lib/tenant-utils";

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

// Helper function to get next repair number (tenant-scoped)
async function getNextRepairNumber(): Promise<string> {
  try {
    const seq = await getNextCounter('repairNumber');
    return seq.toString();
  } catch (error) {
    console.error("Error getting next repair number:", error);
    throw error;
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
    const customerNumberStr = formData.get("selectedCustomerNumber") as string;
    const customerNumber = customerNumberStr ? parseInt(customerNumberStr) : undefined;

    // Get repair number from form or generate new one if blank
    let repairNumber = formData.get("repairNumber") as string;
    if (!repairNumber || repairNumber.trim() === '') {
      console.log('repairNumber is blank, generating new one')
      repairNumber = await getNextRepairNumber();
      console.log('new repairNumber', repairNumber)
    } else {
      console.log('repairNumber is not blank, checking if it is a valid number')
      // get current value of repairNumber seq from Counter (tenant-scoped)
      const counterValue = await getCurrentCounter('repairNumber');
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
      console.log('checking if repairNumber is a number and less than 50000 but more than the counter value')
      if (Number(repairNumber) < 50000 && Number(repairNumber) > counterValue) {
        console.log('repairNumber is a number and less than 50000 but more than the counter value, updating counter')
        await setCounter('repairNumber', Number(repairNumber));
      }
    }

    const tenantObjectId = await getTenantObjectId();
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
      customerNumber: customerNumber,
      tenantId: tenantObjectId,
    });

    console.log('dateOut', repair.dateOut);
    console.log('returnDate', repair.returnDate);

    repair.search = buildRepairSearchField(repair);


    console.log("creating this repair", repair);

    await repair.save();

    // update product, set status to "In Repair", also add history item with date, and action= "repair"

    const user = await getShortUser();

    if (productId != null && productId != '') {
      const tenantObjId = await getTenantObjectId();
      await productModel.findOneAndUpdate({
        _id: productId,
        status: { $ne: "Repair" },
        tenantId: tenantObjId
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

    revalidatePath('/repairs');
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
    const tenantObjectId = await getTenantObjectId();
    const currentRepair = await Repair.findOne({ _id: repairId, tenantId: tenantObjectId });

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

    await Repair.findOneAndUpdate({ _id: repairId, tenantId: tenantObjectId }, updateData);
    revalidatePath('/repairs');
    return { success: true };
  } catch (error) {
    console.error("Error updating repair:", error);
    throw error;
  }
}
