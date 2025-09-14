"use server"

import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import dbConnect from "@/lib/dbConnect"
import { customerModel } from "@/lib/models/customer"


import { createLog } from "@/app/actions/logs"
import { KioskTransaction } from "@/lib/models/kiosk-transaction"
import { getNextRepairNumber, createRepairRecord } from "@/lib/repair-utils"
import { z } from "zod"
import { logSchema, lineItemSchema } from "./models/log"
type LogData = z.infer<typeof logSchema>;
type LineItem = z.infer<typeof lineItemSchema>;

async function uploadImageToLog(logId: string, file: File): Promise<boolean> {
  try {
    console.log("Uploading image to log", logId)
    const formData = new FormData();
    formData.append("file", file);
    formData.append("id", logId);

    // Use absolute URL for server-side fetch
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/upload`, {
      method: "POST",
      body: formData,
    });

    return response.ok;
  } catch (error) {
    console.error('Error uploading image:', error);
    return false;
  }
} 

export async function enterKioskMode() {
  // Set a cookie to persist kiosk mode across requests
  const cookieStore = await cookies()
  cookieStore.set('kiosk-mode', 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })
  
  redirect('/kiosk')
}

interface SearchCustomersParams {
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
}

// Helper function to normalize phone numbers by removing formatting
function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[\s\-\(\)\.]/g, '')
}

export async function searchCustomers(params: SearchCustomersParams) {
  await dbConnect()

  console.log("SEARCHING FOR CUSTOMER")
  
  const query: any = {}
  
  // Build search query - all provided fields must match (AND logic)
  const andConditions = []
  
  if (params.firstName) {
    andConditions.push({ firstName: { $regex: `^${params.firstName}$`, $options: 'i' } })
  }
  
  if (params.lastName) {
    andConditions.push({ lastName: { $regex: `^${params.lastName}$`, $options: 'i' } })
  }
  
  if (params.phone) {
    // Normalize the search phone number
    const normalizedSearchPhone = normalizePhoneNumber(params.phone)
    
    // Create regex pattern that matches the normalized digits
    // This will match phone numbers regardless of formatting
    const phoneRegexPattern = normalizedSearchPhone.split('').join('[\\s\\-\\(\\)\\.]*')
    
    // Phone number can match either 'phone' OR 'cell' field
    andConditions.push({
      $or: [
        { phone: { $regex: phoneRegexPattern, $options: 'i' } },
        { cell: { $regex: phoneRegexPattern, $options: 'i' } }
      ]
    })
  }
  
  if (params.email) {
    andConditions.push({ email: { $regex: params.email, $options: 'i' } })
  }
  
  if (andConditions.length > 0) {
    query.$and = andConditions
  }
  
  // Only return active customers
  query.status = { $ne: "Deleted" }

  console.log("query", query)
  
  const customers = await customerModel.find(query)
    .select('firstName lastName email company phone cell')
    .limit(20)
    .lean()
  
  return customers.map((customer: any) => ({
    _id: customer._id.toString(),
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    company: customer.company,
    phone: customer.phone || customer.cell
  }))
}

export async function submitKioskTransaction(transaction: KioskTransaction, images?: File[]) {
  try {

    console.log('in submitKioskTransaction')

    // Create repair records first if there are repairs
    const createdRepairs: { repairNumber: string; repairId: string }[] = []
    
    if (transaction.repairs && transaction.repairs.length > 0) {
      // Get starting repair number
      let currentRepairNumber = parseInt(await getNextRepairNumber())
      
      for (const repair of transaction.repairs) {

        console.log('in createRepairRecord, itemValue is ' + repair.itemValue)
        const repairResult = await createRepairRecord({
          repairNumber: currentRepairNumber.toString(),
          customerId: transaction.customer._id || '',
          customerFirstName: transaction.customer.firstName,
          customerLastName: transaction.customer.lastName,
          email: transaction.customer.email,
          phone: transaction.customer.phone,
          brand: repair.brand,
          material: repair.material,
          description: repair.description,
          itemValue: repair.itemValue,
          repairOptions: repair.repairOptions,
          repairNotes: repair.additionalDetails || ''
        })
        
        if (repairResult.success) {
          createdRepairs.push({
            repairNumber: repairResult.repairNumber!,
            repairId: repairResult.repairId!
          })
        }
        
        currentRepairNumber++
      }
    }

    // Build line items array
    const lineItems: LineItem[] = []
    
    // Add repair items with actual repair numbers
    transaction.repairs?.forEach((repair, index) => {
      const selectedOptions = []
      if (repair.repairOptions.service) selectedOptions.push("Service")
      if (repair.repairOptions.polish) selectedOptions.push("Polish") 
      if (repair.repairOptions.batteryChange) selectedOptions.push("Battery Change")
      if (repair.repairOptions.other) selectedOptions.push("Other")
      
      const repairNumber = createdRepairs[index]?.repairNumber || `KIOSK-${Date.now()}-${index + 1}`
      
      lineItems.push({
        itemNumber: '',
        name: `${repair.brand} ${repair.material} ${repair.additionalDetails ? `${repair.additionalDetails}` : ''} ${repair.description ? ` - ${repair.description}` : ''}`,
        repairNumber: repairNumber,
      })
    })
    
    // Add offer items
    transaction.offers?.forEach((offer) => {
      lineItems.push({
        itemNumber: '',
        name: `${offer.brand} ${offer.model} ${offer.material} ${offer.material} ${offer.condition} offer ${offer.description ? ` - ${offer.description}` : ''}`,
        repairNumber: '',
      })
    })

    const logData: LogData = {
      date: new Date(),
      receivedFrom: "Other",
      comments: transaction.comments || '',
      customerName: `${transaction.customer.firstName} ${transaction.customer.lastName}`,
      vendor: '',
      user: "Kiosk",
      lineItems,
      signature: transaction.signature,
      signatureDate: transaction.signatureDate
    }

    const result = await createLog(logData)

    if (result.success) {
      const logId = result.data?._id;
      
      // Upload images after log creation if images are provided
      if (images && images.length > 0 && logId) {
        const uploadPromises = images.map(image => uploadImageToLog(logId, image));
        const uploadResults = await Promise.all(uploadPromises);
        const successfulUploads = uploadResults.filter(result => result).length;
        
        console.log(`Uploaded ${successfulUploads} of ${images.length} images to log ${logId}`);
      }
      
      return {
        success: true,
        logId: logId,
        repairsCreated: createdRepairs.length,
        imagesUploaded: images ? images.length : 0
      }
    } else {
      return {
        success: false,
        message: result.error || "Failed to create log entry"
      }
    }
  } catch (error) {
    console.error('Error submitting kiosk transaction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
