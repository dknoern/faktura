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

    const customer = await customerModel.create({
      ...data,
      _id: newCustomerNumber.seq,
      lastUpdated: new Date(),
      search: `${data.firstName} ${data.lastName} ${data.company} ${data.email} ${data.phone}`.toLowerCase(),
    });

    revalidatePath('/customers');
    return { success: true, data: customer.toObject() };
  } catch (error) {
    console.error("Error creating customer:", error);
    return { success: false, error: "Failed to create customer" };
  }
}

export async function updateCustomer(id: number, data: CustomerFormData): Promise<ActionResult<CustomerData>> {
  try {
    await dbConnect();

    const customer = await customerModel.findByIdAndUpdate(
      id,
      {
        ...data,
        lastUpdated: new Date(),
        search: `${data.firstName} ${data.lastName} ${data.company} ${data.email} ${data.phone}`.toLowerCase(),
      },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return { success: false, error: "Customer not found" };
    }

    revalidatePath('/customers');
    return { success: true, data: customer.toObject() };
  } catch (error) {
    console.error("Error updating customer:", error);
    return { success: false, error: "Failed to update customer" };
  }
} 