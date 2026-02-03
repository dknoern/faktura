import { z } from "zod";
import { extendZod } from "@zodyac/zod-mongoose";
import { zodSchema } from "@zodyac/zod-mongoose";
import mongoose, { model } from "mongoose";

extendZod(z);

export const customerSchema = z.object({
    _id: z.instanceof(mongoose.Types.ObjectId).or(z.string()),
  customerNumber: z.number().optional(),
  tenantId: z.instanceof(mongoose.Types.ObjectId).or(z.string()),
  firstName: z.string().min(2).max(255),
  lastName: z.string().min(2).max(255),
  company: z.string().optional(),
  emails: z.array(z.object({
    email: z.string().email("Invalid email address"),
    type: z.enum(["home", "work", "other"]).optional(),
  })).optional(),
  phones: z.array(z.object({
    phone: z.string(),
    type: z.enum(["home", "work", "mobile", "other"]).optional(),
  })).optional(),
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
  attachments: z.array(z.object({
    fileName: z.string(),
    originalName: z.string(),
    uploadDate: z.date(),
    fileSize: z.number(),
    mimeType: z.string(),
  })).optional(),
});


const customerZodSchema = zodSchema(customerSchema);

// Manually set _id and tenantId to ObjectId type for proper Mongoose querying
customerZodSchema.path('_id').instance = 'ObjectID';
customerZodSchema.path('tenantId').instance = 'ObjectID';

// Disable _id on email and phone subdocuments
const emailsPath = customerZodSchema.path('emails');
if (emailsPath?.schema) {
  emailsPath.schema.set('_id', false);
}
const phonesPath = customerZodSchema.path('phones');
if (phonesPath?.schema) {
  phonesPath.schema.set('_id', false);
}

export const customerModel = mongoose.models.customer || model("customer", customerZodSchema);

// Type for serialized customer data (after ObjectIds are converted to strings for Client Components)
export type SerializedCustomer = Omit<z.infer<typeof customerSchema>, '_id' | 'tenantId'> & {
  _id: string;
  tenantId: string;
};
