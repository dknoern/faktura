import { z } from "zod";
import { extendZod } from "@zodyac/zod-mongoose";
import { zodSchema } from "@zodyac/zod-mongoose";
import mongoose, { model } from "mongoose";

extendZod(z);

// Base schema without _id for Mongoose (lets Mongoose use default ObjectId _id)
// Holds both time and expense entries; older documents without entryType are time entries
const timeEntryBaseSchema = z.object({
  entryType: z.enum(["time", "expense"]).optional(),
  vendorId: z.string(),
  // Snapshots for display so entries stay readable if the source records change
  vendorName: z.string().optional(),
  proposalId: z.string(),
  projectName: z.string().optional(),
  // Calendar date as YYYY-MM-DD — a plain string avoids timezone drift
  date: z.string(),
  // Time entries only
  hours: z.number().min(0.1).max(24).optional(),
  // Expense entries only
  description: z.string().optional(),
  amount: z.number().optional(),
  // Subfields must be optional too: zod-mongoose flattens this into nested
  // mongoose paths, and required inner fields would fail validation on
  // entries that have no receipt at all
  receipt: z.object({
    fileName: z.string().optional(),
    originalName: z.string().optional(),
    fileSize: z.number().optional(),
    mimeType: z.string().optional(),
    uploadDate: z.date().optional(),
  }).optional(),
  comment: z.string().optional(),
  status: z.enum(["Pending", "Approved", "Rejected", "Paid"]),
  // Set when the entry is included in a vendor payout
  paymentId: z.string().optional(),
  enteredBy: z.string().optional(),
  enteredByRole: z.enum(["vendor", "admin"]).optional(),
  reviewedBy: z.string().optional(),
  reviewedAt: z.date().optional(),
  createdAt: z.date(),
  lastUpdated: z.date(),
});

// Extended schema with _id for TypeScript type inference in components
export const timeEntrySchema = timeEntryBaseSchema.extend({
  _id: z.any().optional(),
});

const timeEntryZodSchema = zodSchema(timeEntryBaseSchema);

(timeEntryZodSchema as any).add({ tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' } });
export const timeEntryModel = mongoose.models.timeEntry || model("timeEntry", timeEntryZodSchema);
