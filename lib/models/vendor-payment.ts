import { z } from "zod";
import { extendZod } from "@zodyac/zod-mongoose";
import { zodSchema } from "@zodyac/zod-mongoose";
import mongoose, { model } from "mongoose";

extendZod(z);

// A payout to a vendor covering one or more approved time/expense entries.
// Named VendorPayment because `Payment` already tracks invoice payments.
const vendorPaymentBaseSchema = z.object({
  payoutNumber: z.number().optional(),
  vendorId: z.string(),
  vendorName: z.string().optional(),
  method: z.enum(["check", "venmo", "other"]),
  checkNumber: z.string().optional(),
  note: z.string().optional(),
  // Breakdown captured at payout time
  timeHours: z.number().optional(),
  hourlyRate: z.number().optional(),
  timeAmount: z.number().optional(),
  expenseAmount: z.number().optional(),
  totalAmount: z.number(),
  entryCount: z.number().optional(),
  paidBy: z.string().optional(),
  createdAt: z.date(),
  lastUpdated: z.date(),
});

// Extended schema with _id for TypeScript type inference in components
export const vendorPaymentSchema = vendorPaymentBaseSchema.extend({
  _id: z.any().optional(),
});

const vendorPaymentZodSchema = zodSchema(vendorPaymentBaseSchema);

(vendorPaymentZodSchema as any).add({ tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' } });
export const vendorPaymentModel = mongoose.models.vendorPayment || model("vendorPayment", vendorPaymentZodSchema);
