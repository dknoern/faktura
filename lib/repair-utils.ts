"use server"

import dbConnect from "@/lib/dbConnect"
import { Repair } from "@/lib/models/repair"
import { fetchTenant } from "./data"
import { getNextCounter, getTenantObjectId } from "@/lib/tenant-utils"

export async function getNextRepairNumber(): Promise<string> {
  try {
    await dbConnect()
    const seq = await getNextCounter('repairNumber')
    return seq.toString()
  } catch (error) {
    console.error('Error getting next repair number:', error)
    // Fallback to timestamp-based number
    return Date.now().toString()
  }
}

export async function createRepairRecord(repairData: {
  repairNumber: string
  customerId: string
  customerFirstName: string
  customerLastName: string
  email?: string
  phone?: string
  brand: string
  material: string
  description?: string
  itemValue?: string
  repairOptions?: string
  repairNotes?: string
}) {
  try {
    await dbConnect()

    const tenant = await fetchTenant();
    const repairConfirmMessage = tenant.repairConfirmationText || "Thank you for your repair request. We will contact you soon.";
    
    const tenantObjectId = await getTenantObjectId();
    const repair = new Repair({
      repairNumber: repairData.repairNumber,
      tenantId: tenantObjectId,
      itemNumber: null, // No item number for trello repairs
      description: repairData.description || '',
      dateOut: new Date(),
      customerFirstName: repairData.customerFirstName,
      customerLastName: repairData.customerLastName,
      email: repairData.email,
      phone: repairData.phone,
      vendor: null, // Vendor assigned later
      repairIssues: repairData.repairOptions || '',
      repairNotes: `${repairData.itemValue ? 'Item Value: ${repairData.itemValue}\n' : ''}${repairData.repairNotes}`,
      warrantyService: false,
      customerId: repairData.customerId || '',
      itemId: null, // No specific product linked for trello repairs
      // get repairConfirmMessage from tenant config
      messages: [{
        date: new Date(),
        from: tenant.name,
        message: repairConfirmMessage
      }]
    })

    // Build search string
    repair.search = [
      repair.repairNumber,
      repair.itemNumber,
      repair.description,
      repair.customerFirstName,
      repair.customerLastName,
      repair.vendor
    ].filter(Boolean).join(" ")

    await repair.save()
    
    return {
      success: true,
      repairId: repair._id,
      repairNumber: repair.repairNumber
    }
  } catch (error) {
    console.error('Error creating repair record:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
