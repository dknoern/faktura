"use server"

import dbConnect from "@/lib/dbConnect"
import { Repair } from "@/lib/models/repair"
import { Counter } from "@/lib/models/counter"
import { fetchDefaultTenant } from "./data"

export async function getNextRepairNumber(): Promise<string> {
  try {
    await dbConnect()
    
    // Use findOneAndUpdate to atomically increment the counter
    const counter = await Counter.findOneAndUpdate(
      { _id: 'repairNumber' },
      { $inc: { seq: 1 } },
      { 
        new: true, 
        upsert: true, // Create if doesn't exist
        setDefaultsOnInsert: true 
      }
    )
    
    return counter.seq.toString()
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

    const tenant = await fetchDefaultTenant();
    const repairConfirmMessage = tenant.repairConfirmationText || "Thank you for your repair request. We will contact you soon.";
    
    const repair = new Repair({
      repairNumber: repairData.repairNumber,
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
      customerId: parseInt(repairData.customerId) || 0,
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
