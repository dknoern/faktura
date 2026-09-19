import { z } from "zod";
import { extendZod } from "@zodyac/zod-mongoose";
import { zodSchema } from "@zodyac/zod-mongoose";
import mongoose, { model } from "mongoose";

extendZod(z);

// Base schema without _id for Mongoose (lets Mongoose use default ObjectId _id)
const timeEntryBaseSchema = z.object({
  vendorId: z.string(),
  // Snapshots for display so entries stay readable if the source records change
  vendorName: z.string().optional(),
  proposalId: z.string(),
  projectName: z.string().optional(),
  // Calendar date as YYYY-MM-DD — a plain string avoids timezone drift
  date: z.string(),
  hours: z.number().min(0.1).max(24),
  comment: z.string().optional(),
  status: z.enum(["Pending", "Approved", "Rejected"]),
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
