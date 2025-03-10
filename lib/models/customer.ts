import { z } from "zod";
import { extendZod } from "@zodyac/zod-mongoose";
import { zodSchema } from "@zodyac/zod-mongoose";
import { model } from "mongoose";

extendZod(z);

const customer = z.object({
  firstName: z.string().min(3).max(255),
  lastName: z.string().min(3).max(255),
  company: z.string().min(3).max(255),
  email: z.string().min(3).max(255),
  phone: z.string().min(3).max(255),
  cell: z.string().min(3).max(255),
  address1: z.string().min(3).max(255),
  address2: z.string().min(3).max(255),
  address3: z.string().min(3).max(255),
  city: z.string().min(3).max(255),
  state: z.string().min(3).max(255),
  zip: z.string().min(3).max(255),
  country: z.string().min(3).max(255),
  billingAddress1: z.string().min(3).max(255),
  billingAddress2: z.string().min(3).max(255),
  billingAddress3: z.string().min(3).max(255),
  billingCity: z.string().min(3).max(255),
  billingState: z.string().min(3).max(255),
  billingZip: z.string().min(3).max(255),
  billingCountry: z.string().min(3).max(255),
  lastUpdated: z.string().min(3).max(255),
  search: z.string().min(3).max(255),
  copyAddress: z.boolean(),
  customerType: z.string().min(3).max(255),
  status:  z.string().min(3).max(255),
});

export const customerSchema = zodSchema(customer);
export const customerModel = model("Customer", customerSchema);
