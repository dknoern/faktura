import { z } from "zod";
import { extendZod } from "@zodyac/zod-mongoose";
import { zodSchema } from "@zodyac/zod-mongoose";
import mongoose, { model } from "mongoose";

extendZod(z);

export const customerSchema = z.object({
    _id: z.number(),
  firstName: z.string().min(2).max(255),
  lastName: z.string().min(2).max(255),
  company: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  phone: z.string().optional(),
  cell: z.string().optional(),
  address1: z.string().optional(),
  address2: z.string().optional(),
  address3: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  billingAddress1: z.string().optional(),
  billingAddress2: z.string().optional(),
  billingAddress3: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingZip: z.string().optional(),
  billingCountry: z.string().optional(),
  lastUpdated: z.date(),
  search: z.string().optional(),
  copyAddress: z.boolean().optional(),
  customerType: z.string().optional(),
  status:  z.string().optional(),
});


const customerZodSchema = zodSchema(customerSchema);
export const customerModel = mongoose.models.customer || model("customer", customerZodSchema);
