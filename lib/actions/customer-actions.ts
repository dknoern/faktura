'use server'

import dbConnect from "@/lib/dbConnect";
import { customerModel } from "@/lib/models/customer";
import { Invoice } from "@/lib/models/invoice";
import { Repair } from "@/lib/models/repair";
import { Return } from "@/lib/models/return";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { customerSchema } from "@/lib/models/customer";
import { getNextCounter, getTenantObjectId } from "@/lib/tenant-utils";

type CustomerData = z.infer<typeof customerSchema>;
type CustomerFormData = Omit<CustomerData, '_id' | 'lastUpdated' | 'search'>;

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type MergeCustomersResult = {
  success: boolean;
  message: string;
  count?: number;
};

export async function createCustomer(data: CustomerFormData): Promise<ActionResult<CustomerData>> {
  try {
    await dbConnect();

    const newCustomerNumber = await getNextCounter('customerNumber');
    const tenantObjectId = await getTenantObjectId();

    const emailsString = data.emails
      ? data.emails.map((item: any) => typeof item === 'string' ? item : item.email).join(' ')
      : '';
    const phonesString = data.phones
      ? data.phones.map((item: any) => typeof item === 'string' ? item : item.phone).join(' ')
      : '';

    const customer = await customerModel.create({
      ...data,
      customerNumber: newCustomerNumber,
      lastUpdated: new Date(),
      tenantId: tenantObjectId,
      search: `${newCustomerNumber} ${data.firstName} ${data.lastName} ${data.company} ${emailsString} ${phonesString}`.toLowerCase(),
    });

    revalidatePath('/customers');
    const customerObj = customer.toObject();
    customerObj._id = customerObj._id.toString();
    if (customerObj.tenantId) customerObj.tenantId = customerObj.tenantId.toString();

    // Convert emails and phones to plain objects without MongoDB _id fields
    if (customerObj.emails) {
      customerObj.emails = customerObj.emails.map((item: any) => ({
        email: item.email,
        type: item.type
      }));
    }
    if (customerObj.phones) {
      customerObj.phones = customerObj.phones.map((item: any) => ({
        phone: item.phone,
        type: item.type
      }));
    }

    return { success: true, data: customerObj };
  } catch (error) {
    console.error("Error creating customer:", error);
    return { success: false, error: "Failed to create customer" };
  }
}

export async function updateCustomer(id: string, data: CustomerFormData): Promise<ActionResult<CustomerData>> {
  try {
    await dbConnect();

    const emailsString = data.emails
      ? data.emails.map((item: any) => typeof item === 'string' ? item : item.email).join(' ')
      : '';
    const phonesString = data.phones
      ? data.phones.map((item: any) => typeof item === 'string' ? item : item.phone).join(' ')
      : '';

    const tenantObjectId = await getTenantObjectId();
    // Fetch existing customer to get customerNumber for search field
    const existingCustomer = await customerModel.findOne({ _id: id, tenantId: tenantObjectId }).select('customerNumber');
    const customerNumber = existingCustomer?.customerNumber || '';

    const customer = await customerModel.findOneAndUpdate(
      { _id: id, tenantId: tenantObjectId },
      {
        ...data,
        lastUpdated: new Date(),
        search: `${customerNumber} ${data.firstName} ${data.lastName} ${data.company} ${emailsString} ${phonesString}`.toLowerCase(),
      },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return { success: false, error: "Customer not found" };
    }

    revalidatePath('/customers');
    const customerObj = customer.toObject();
    customerObj._id = customerObj._id.toString();
    if (customerObj.tenantId) customerObj.tenantId = customerObj.tenantId.toString();

    // Convert emails and phones to plain objects without MongoDB _id fields
    if (customerObj.emails) {
      customerObj.emails = customerObj.emails.map((item: any) => ({
        email: item.email,
        type: item.type
      }));
    }
    if (customerObj.phones) {
      customerObj.phones = customerObj.phones.map((item: any) => ({
        phone: item.phone,
        type: item.type
      }));
    }

    return { success: true, data: customerObj };
  } catch (error) {
    console.error("Error updating customer:", error);
    return { success: false, error: "Failed to update customer" };
  }
}

export async function mergeCustomers(customerIds: string[]): Promise<MergeCustomersResult> {
  try {
    if (!customerIds || customerIds.length < 2) {
      return { 
        success: false, 
        message: "At least two customers must be selected for merging" 
      };
    }

    await dbConnect();
    const tenantObjectId = await getTenantObjectId();
    
    // Find all customers and pick the one with the lowest customerNumber as canonical
    const allCustomerDocs = await customerModel.find({ _id: { $in: customerIds }, tenantId: tenantObjectId }).sort({ customerNumber: 1 });
    if (allCustomerDocs.length === 0) {
      return {
        success: false,
        message: "No customers found"
      };
    }
    
    const canonicalCustomer = allCustomerDocs[0];
    const canonicalId = canonicalCustomer._id.toString();
    const canonicalCustomerNumber = canonicalCustomer.customerNumber;
    
    // Process each customer ID
    for (const id of customerIds) {
      // Update invoices to point to the canonical customer
      const invoices = await Invoice.find({ customerId: id, tenantId: tenantObjectId });
      for (const invoice of invoices) {
        if (id !== canonicalId) {
          console.log(`Moving invoice ${invoice._id} from customer ${invoice.customerId} to ${canonicalId}`);
          invoice.customerId = canonicalId;
          invoice.customerNumber = canonicalCustomerNumber;
          await invoice.save();
        }
      }
      
      // Update returns to point to the canonical customer
      const returns = await Return.find({ customerId: id, tenantId: tenantObjectId });
      for (const returnDoc of returns) {
        if (id !== canonicalId) {
          console.log(`Moving return ${returnDoc._id} from customer ${returnDoc.customerId} to ${canonicalId}`);
          returnDoc.customerId = canonicalId;
          returnDoc.customerNumber = canonicalCustomerNumber;
          await returnDoc.save();
        }
      }

      // Update repairs to point to the canonical customer
      const repairs = await Repair.find({ customerId: id, tenantId: tenantObjectId });
      for (const repair of repairs) {
        if (id !== canonicalId) {
          console.log(`Moving repair ${repair._id} from customer ${repair.customerId} to ${canonicalId}`);
          repair.customerId = canonicalId;
          repair.customerNumber = canonicalCustomerNumber;
          await repair.save();
        }
      }
    }
    
    // Use the already-fetched customer documents
    const allCustomers = allCustomerDocs;

    // Merge customer data and delete secondary customers
    for (let i = 1; i < allCustomers.length; i++) {
      const customer = allCustomers[i];
      if (customer) {
        // Merge data from this customer into the canonical customer
        overlayCustomer(canonicalCustomer, customer);

        // Delete the merged customer
        console.log(`Deleting merged customer ${customer._id}`);
        await customerModel.deleteOne({ _id: customer._id, tenantId: tenantObjectId });
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
