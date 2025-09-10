"use server"

import dbConnect from "@/lib/dbConnect"
import { Repair } from "@/lib/models/repair"
import { Counter } from "@/lib/models/counter"

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
  referenceNumber?: string
  repairOptions: {
    service: boolean
    polish: boolean
    batteryChange: boolean
    other: boolean
  }
  repairNotes: string
}) {
  try {
    await dbConnect()
    
    // Build description from repair options
    const selectedOptions = []
    if (repairData.repairOptions.service) selectedOptions.push("Service")
    if (repairData.repairOptions.polish) selectedOptions.push("Polish")
    if (repairData.repairOptions.batteryChange) selectedOptions.push("Battery Change")
    if (repairData.repairOptions.other) selectedOptions.push("Other")
    
    const description = `${repairData.brand} watch - ${repairData.material}${repairData.referenceNumber ? ` (Ref: ${repairData.referenceNumber})` : ''}`

    const repair = new Repair({
      repairNumber: repairData.repairNumber,
      itemNumber: null, // No item number for kiosk repairs
      description: description,
      dateOut: new Date(),
      customerFirstName: repairData.customerFirstName,
      customerLastName: repairData.customerLastName,
      email: repairData.email,
      phone: repairData.phone,
      vendor: null, // Vendor assigned later
      repairIssues: selectedOptions.length > 0 ? `${selectedOptions.join(", ")}` : '',
      repairNotes: repairData.repairNotes,
      warrantyService: false,
      customerId: parseInt(repairData.customerId) || 0,
      itemId: null, // No specific product linked for kiosk repairs
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
