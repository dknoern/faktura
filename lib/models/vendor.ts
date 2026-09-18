import { z } from "zod";
import { extendZod } from "@zodyac/zod-mongoose";
import { zodSchema } from "@zodyac/zod-mongoose";
import mongoose, { model } from "mongoose";

extendZod(z);

// Base schema without _id for Mongoose (lets Mongoose use default ObjectId _id)
const vendorBaseSchema = z.object({
  vendorNumber: z.number().optional(),
  firstName: z.string().min(2).max(255),
  lastName: z.string().min(2).max(255),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  company: z.string().optional(),
  taxId: z.string().optional(),
  venmoAlias: z.string().optional(),
  address1: z.string().optional(),
  address2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  status: z.string().optional(),
  // Set once the vendor has been invited as a user of the tenant
  auth0UserId: z.string().optional(),
  invitedAt: z.date().optional(),
  // Set when the vendor accepts the invitation and sets their password
  acceptedAt: z.date().optional(),
  lastUpdated: z.date(),
  search: z.string().optional(),
});

// Extended schema with _id for TypeScript type inference in components
export const vendorSchema = vendorBaseSchema.extend({
  _id: z.any().optional(),
});

const vendorZodSchema = zodSchema(vendorBaseSchema);

(vendorZodSchema as any).add({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
  // Invite-acceptance token (sha256 hash); excluded from queries by default
  inviteTokenHash: { type: String, select: false },
  inviteTokenExpiresAt: { type: Date },
});
export const vendorModel = mongoose.models.vendor || model("vendor", vendorZodSchema);
