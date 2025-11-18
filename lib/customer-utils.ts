"use server"

import dbConnect from "@/lib/dbConnect"
import { customerModel } from "@/lib/models/customer"

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
    andConditions.push({ firstName: { $regex: `^\\s*${params.firstName}\\s*$`, $options: 'i' } })
  }

  if (params.lastName) {
    andConditions.push({ lastName: { $regex: `^\\s*${params.lastName}\\s*$`, $options: 'i' } })
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
      'phones.phone': { $regex: digitPattern, $options: 'i' }
    })
  }

  if (params.email) {
    andConditions.push({
      'emails.email': { $regex: params.email, $options: 'i' }
    })
  }

  if (andConditions.length > 0) {
    query.$and = andConditions
  }

  // Only return active customers
  query.status = { $ne: "Deleted" }

  console.log("query", query)

  const customers = await customerModel.find(query)
    .select('firstName lastName emails company phones')
    .sort({ _id: 1 })
    .limit(20)
    .lean()

  return customers.map((customer: any) => ({
    _id: customer._id.toString(),
    firstName: customer.firstName,
    lastName: customer.lastName,
    emails: customer.emails,
    company: customer.company,
    phones: customer.phones
  }))
}
