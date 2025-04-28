import { z } from "zod";
import { extendZod } from "@zodyac/zod-mongoose";
import mongoose from "mongoose";
import zodToMongoose from "@zodyac/zod-mongoose";
extendZod(z);

const lineItemSchema = z.object({
  itemNumber: z.string().optional(),
  name: z.string().optional(),
  repairNumber: z.string().optional(),
  repairCost: z.number().optional(),
  productId: z.string().optional(),
  repairId: z.string().optional(),
});

export const CARRIER_OPTIONS = [
  "FedEx",
  "UPS",
  "USPS",
  "Courier",
  "Other"
] as const;

export const logSchema = z.object({
  id: z.string().optional(),
  date: z.date(),
  receivedFrom: z.enum(CARRIER_OPTIONS, {
    errorMap: () => ({ message: "Please select a carrier" })
  }),
  comments: z.string().optional(),
  user: z.string().optional(),
  customerName: z.string().optional(),
  search: z.string().optional(),
  lineItems: z.array(lineItemSchema).optional(),
});

const logMongooseSchema = zodToMongoose(logSchema);
export const logModel = mongoose.models?.log || mongoose.model("log", logMongooseSchema);

