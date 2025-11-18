'use server'

import dbConnect from "@/lib/dbConnect";
import { customerModel } from "@/lib/models/customer";
import { Invoice } from "@/lib/models/invoice";
import { Repair } from "@/lib/models/repair";
import { Return } from "@/lib/models/return";
import { revalidatePath } from "next/cache";

type MergeCustomersResult = {
  success: boolean;
  message: string;
  count?: number;
};

export async function mergeCustomers(customerIds: number[]): Promise<MergeCustomersResult> {
  try {
    if (!customerIds || customerIds.length < 2) {
      return { 
        success: false, 
        message: "At least two customers must be selected for merging" 
      };
    }

    await dbConnect();
    
    // The first customer ID will be the canonical (primary) customer
    // canonicalId should be the one with the lowest

    // sort customerIds in ascending order, canonicalId will be the first
    customerIds.sort((a, b) => a - b);
    const canonicalId = customerIds[0];
    
    // Find the canonical customer
    const canonicalCustomer = await customerModel.findById(canonicalId);
    if (!canonicalCustomer) {
      return {
        success: false,
        message: "Primary customer not found"
      };
    }
    
    // Process each customer ID
    for (const id of customerIds) {
      // Update invoices to point to the canonical customer
      const invoices = await Invoice.find({ customerId: id });
      for (const invoice of invoices) {
        if (id !== canonicalId) {
          console.log(`Moving invoice ${invoice._id} from customer ${invoice.customerId} to ${canonicalId}`);
          invoice.customerId = canonicalId;
          await invoice.save();
        }
      }
      
      // Update returns to point to the canonical customer
      const returns = await Return.find({ customerId: id });
      for (const returnDoc of returns) {
        if (id !== canonicalId) {
          console.log(`Moving return ${returnDoc._id} from customer ${returnDoc.customerId} to ${canonicalId}`);
          returnDoc.customerId = canonicalId;
          await returnDoc.save();
        }
      }

      // Update repairs to point to the canonical customer
      const repairs = await Repair.find({ customerId: id });
      for (const repair of repairs) {
        if (id !== canonicalId) {
          console.log(`Moving repair ${repair._id} from customer ${repair.customerId} to ${canonicalId}`);
          repair.customerId = canonicalId;
          await repair.save();
        }
      }
    }
    
    // Collect all customers for merging
    const allCustomers = [canonicalCustomer];
    for (let i = 1; i < customerIds.length; i++) {
      const customer = await customerModel.findById(customerIds[i]);
      if (customer) {
        allCustomers.push(customer);
      }
    }

    // Merge customer data and delete secondary customers
    for (let i = 1; i < allCustomers.length; i++) {
      const customer = allCustomers[i];
      if (customer) {
        // Merge data from this customer into the canonical customer
        overlayCustomer(canonicalCustomer, customer);

        // Delete the merged customer
        console.log(`Deleting merged customer ${customer._id}`);
        await customerModel.deleteOne({ _id: customer._id });
      }
    }

    // Combine all unique emails with types from all customers
    const emailMap = new Map<string, string | undefined>();
    for (const customer of allCustomers) {
      // Add emails from the new emails array (with types)
      if (customer.emails && Array.isArray(customer.emails)) {
        customer.emails.forEach((emailItem: any) => {
          const email = typeof emailItem === 'string' ? emailItem : emailItem.email;
          const type = typeof emailItem === 'object' ? emailItem.type : undefined;
          if (email && email.trim()) {
            // Keep existing type if email already exists, otherwise set new type
            if (!emailMap.has(email.trim())) {
              emailMap.set(email.trim(), type);
            }
          }
        });
      }
      // Also add the legacy email field if it exists
      if (customer.email && customer.email.trim()) {
        if (!emailMap.has(customer.email.trim())) {
          emailMap.set(customer.email.trim(), undefined);
        }
      }
    }

    // Combine all unique phone numbers with types from all customers
    const phoneMap = new Map<string, string | undefined>();
    for (const customer of allCustomers) {
      // Add phones from the new phones array (with types)
      if (customer.phones && Array.isArray(customer.phones)) {
        customer.phones.forEach((phoneItem: any) => {
          const phone = typeof phoneItem === 'string' ? phoneItem : phoneItem.phone;
          const type = typeof phoneItem === 'object' ? phoneItem.type : undefined;
          if (phone && phone.trim()) {
            // Keep existing type if phone already exists, otherwise set new type
            if (!phoneMap.has(phone.trim())) {
              phoneMap.set(phone.trim(), type);
            }
          }
        });
      }
      // Also add the legacy phone field if it exists
      if (customer.phone && customer.phone.trim()) {
        if (!phoneMap.has(customer.phone.trim())) {
          phoneMap.set(customer.phone.trim(), undefined);
        }
      }
      // Also add cell phone if it exists
      if (customer.cell && customer.cell.trim()) {
        if (!phoneMap.has(customer.cell.trim())) {
          phoneMap.set(customer.cell.trim(), 'mobile');
        }
      }
    }

    // Convert maps to arrays of objects
    canonicalCustomer.emails = Array.from(emailMap.entries()).map(([email, type]) => ({
      email,
      type: type as 'home' | 'work' | 'other' | undefined
    }));
    canonicalCustomer.phones = Array.from(phoneMap.entries()).map(([phone, type]) => ({
      phone,
      type: type as 'home' | 'work' | 'mobile' | 'other' | undefined
    }));

    // Update the search field with all emails and phones
    const emailsString = canonicalCustomer.emails.map((item: any) => item.email).join(' ');
    const phonesString = canonicalCustomer.phones.map((item: any) => item.phone).join(' ');
    canonicalCustomer.search = `${canonicalCustomer.firstName} ${canonicalCustomer.lastName} ${canonicalCustomer.company} ${emailsString} ${phonesString}`.toLowerCase();
    
    // Save the updated canonical customer
    await canonicalCustomer.save();
    
    // Revalidate the customers page to refresh the data
    revalidatePath('/customers');
    
    return { 
      success: true, 
      message: `${customerIds.length} customers merged successfully`,
      count: customerIds.length
    };
  } catch (error) {
    console.error("Error merging customers:", error);
    return { 
      success: false, 
      message: "Failed to merge customers: " + (error instanceof Error ? error.message : String(error))
    };
  }
}

/**
 * Overlays data from the source customer to the canonical customer,
 * only filling in fields that are empty in the canonical customer
 */
function overlayCustomer(canonicalCustomer: any, customer: any) {
  if (!customer || !canonicalCustomer) {
    return;
  }

  canonicalCustomer.firstName = overlayField(canonicalCustomer.firstName, customer.firstName);
  canonicalCustomer.lastName = overlayField(canonicalCustomer.lastName, customer.lastName);
  canonicalCustomer.company = overlayField(canonicalCustomer.company, customer.company);
  canonicalCustomer.address1 = overlayField(canonicalCustomer.address1, customer.address1);
  canonicalCustomer.address2 = overlayField(canonicalCustomer.address2, customer.address2);
  canonicalCustomer.city = overlayField(canonicalCustomer.city, customer.city);
  canonicalCustomer.state = overlayField(canonicalCustomer.state, customer.state);
  canonicalCustomer.zip = overlayField(canonicalCustomer.zip, customer.zip);
  canonicalCustomer.country = overlayField(canonicalCustomer.country, customer.country);
  canonicalCustomer.billingAddress1 = overlayField(canonicalCustomer.billingAddress1, customer.billingAddress1);
  canonicalCustomer.billingAddress2 = overlayField(canonicalCustomer.billingAddress2, customer.billingAddress2);
  canonicalCustomer.billingCity = overlayField(canonicalCustomer.billingCity, customer.billingCity);
  canonicalCustomer.billingState = overlayField(canonicalCustomer.billingState, customer.billingState);
  canonicalCustomer.billingZip = overlayField(canonicalCustomer.billingZip, customer.billingZip);
  canonicalCustomer.billingCountry = overlayField(canonicalCustomer.billingCountry, customer.billingCountry);
}

/**
 * Only replaces the canonical field if it's empty and the source field has a value
 */
function overlayField(canonicalField: string, field: string): string {
  if (isEmpty(canonicalField) && !isEmpty(field)) {
    return field;
  }
  return canonicalField;
}

/**
 * Checks if a string is empty or undefined
 */
function isEmpty(str?: string): boolean {
  return (!str || str.length === 0);
}
