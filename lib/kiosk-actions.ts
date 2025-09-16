"use server"

import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import dbConnect from "@/lib/dbConnect"
import { customerModel } from "@/lib/models/customer"


import { createLog } from "@/app/actions/logs"
import { KioskTransaction } from "@/lib/models/kiosk-transaction"
import { getNextRepairNumber, createRepairRecord } from "@/lib/repair-utils"
import { createTrelloRepairCards } from "@/lib/trello-api"
import { uploadBase64ImagesToRepair } from './repair-image-utils';
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
  return phone.replace(/[^\d]/g, '')
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
    // Normalize the search phone number to digits only
    let normalizedSearchPhone = normalizePhoneNumber(params.phone)
    
    // if normalizedSearchPhone is 11 digits and first digit is "1", remove the first digit
    if (normalizedSearchPhone.length === 11 && normalizedSearchPhone.startsWith('1')) {
      normalizedSearchPhone = normalizedSearchPhone.slice(1)
    }

    console.log("normalizedSearchPhone", normalizedSearchPhone)
    
    // Create a regex pattern that matches the digits in sequence, ignoring non-digits
    // For example, "2067897428" becomes a pattern that matches "(206) 789-7428" or "206-789-7428"
    const digitPattern = normalizedSearchPhone.split('').join('[^\\d]*')
    
    andConditions.push({
      $or: [
        { phone: { $regex: digitPattern, $options: 'i' } },
        { cell: { $regex: digitPattern, $options: 'i' } }
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
    .sort({ _id: 1 })
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

      // Upload repair-specific images
      if (createdRepairs.length > 0) {
        for (let i = 0; i < createdRepairs.length; i++) {
          const repair = createdRepairs[i];
          const originalRepair = transaction.repairs![i];
          // Upload images to the repair if there are any
          if (originalRepair.images && originalRepair.images.length > 0) {
            try {
              // Pass base64 images directly to the server-side compatible function
              const uploadResult = await uploadBase64ImagesToRepair(repair.repairId, originalRepair.images);
              console.log(`Uploaded ${uploadResult.uploadedCount} of ${uploadResult.totalCount} images to repair #${repair.repairNumber}`);
            } catch (error) {
              console.error(`Error uploading images to repair #${repair.repairNumber}:`, error);
            }
          }
        }
      }
      
      // Send email notifications for each repair
      if (createdRepairs.length > 0 && transaction.customer.email) {
        const emailPromises = createdRepairs.map(async (repair) => {
          try {
            const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
            const response = await fetch(`${baseUrl}/api/email/send-kiosk-repair`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                repairId: repair.repairId,
                repairNumber: repair.repairNumber,
                customerFirstName: transaction.customer.firstName,
                customerLastName: transaction.customer.lastName,
                customerEmail: transaction.customer.email,
              }),
            });
            
            if (response.ok) {
              console.log(`Email sent for repair #${repair.repairNumber}`);
              return true;
            } else {
              console.error(`Failed to send email for repair #${repair.repairNumber}`);
              return false;
            }
          } catch (error) {
            console.error(`Error sending email for repair #${repair.repairNumber}:`, error);
            return false;
          }
        });
        
        const emailResults = await Promise.all(emailPromises);
        const successfulEmails = emailResults.filter(result => result).length;
        
        console.log(`Sent ${successfulEmails} of ${createdRepairs.length} repair confirmation emails`);
      }

      // Create Trello cards for each repair
      if (createdRepairs.length > 0) {
        const trelloCardData = createdRepairs.map((repair, index) => {
          const originalRepair = transaction.repairs![index]
          return {
            repairNumber: repair.repairNumber,
            repairId: repair.repairId,
            customerName: `${transaction.customer.firstName} ${transaction.customer.lastName}`,
            customerEmail: transaction.customer.email,
            customerPhone: transaction.customer.phone,
            brand: originalRepair.brand,
            material: originalRepair.material,
            description: originalRepair.description,
            itemValue: originalRepair.itemValue,
            repairOptions: originalRepair.repairOptions,
            repairNotes: originalRepair.additionalDetails || '',
            images: originalRepair.images || []
          }
        })

        try {
          const trelloResult = await createTrelloRepairCards(trelloCardData)
          console.log(`Created ${trelloResult.totalCreated} of ${createdRepairs.length} Trello cards for repairs`)
          
          // Log individual results
          trelloResult.results.forEach(result => {
            if (result.success) {
              console.log(`✓ Trello card created for repair #${result.repairNumber}`)
            } else {
              console.error(`✗ Failed to create Trello card for repair #${result.repairNumber}: ${result.error}`)
            }
          })
        } catch (error) {
          console.error('Error creating Trello cards:', error)
          // Don't fail the entire transaction if Trello fails
        }
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
