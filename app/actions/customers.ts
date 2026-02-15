'use server'

import dbConnect from "@/lib/dbConnect";
import { customerModel } from "@/lib/models/customer";
import { Counter } from "@/lib/models/counter";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { customerSchema } from "@/lib/models/customer";

type CustomerData = z.infer<typeof customerSchema>;
type CustomerFormData = Omit<CustomerData, '_id' | 'lastUpdated' | 'search'>;

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function createCustomer(data: CustomerFormData): Promise<ActionResult<CustomerData>> {
  try {
    await dbConnect();

    const newCustomerNumber = await Counter.findByIdAndUpdate({
      _id: 'customerNumber'
    }, {
      $inc: {
        seq: 1
      }
    });

    const emailsString = data.emails
      ? data.emails.map((item: any) => typeof item === 'string' ? item : item.email).join(' ')
      : '';
    const phonesString = data.phones
      ? data.phones.map((item: any) => typeof item === 'string' ? item : item.phone).join(' ')
      : '';

    const customer = await customerModel.create({
      ...data,
      customerNumber: newCustomerNumber.seq,
      lastUpdated: new Date(),
      search: `${newCustomerNumber.seq} ${data.firstName} ${data.lastName} ${data.company} ${emailsString} ${phonesString}`.toLowerCase(),
    });

    revalidatePath('/customers');
    const customerObj = customer.toObject();
    customerObj._id = customerObj._id.toString();

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

    // Fetch existing customer to get customerNumber for search field
    const existingCustomer = await customerModel.findById(id).select('customerNumber');
    const customerNumber = existingCustomer?.customerNumber || '';

    const customer = await customerModel.findByIdAndUpdate(
      id,
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