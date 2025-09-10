import { z } from "zod";
import { extendZod } from "@zodyac/zod-mongoose";
import mongoose from "mongoose";
import zodToMongoose from "@zodyac/zod-mongoose";
extendZod(z);

export const lineItemSchema = z.object({
  itemNumber: z.string().optional(),
  name: z.string().optional(),
  repairNumber: z.string().optional(),
  repairCost: z.number().optional(),
  productId: z.string().optional(),
  repairId: z.string().optional(),
});



export const logSchema = z.object({
  id: z.string().optional(),
  date: z.date(),
  receivedFrom: z.string().min(3).max(255),
  comments: z.string().optional(),
  user: z.string().optional(),
  customerName: z.string().optional(),
  vendor: z.string().optional(),
  search: z.string().optional(),
  lineItems: z.array(lineItemSchema).optional(),
  signature: z.string().optional(),
  signatureDate: z.date().optional(),
});

const logMongooseSchema = zodToMongoose(logSchema);
export const logModel = mongoose.models?.log || mongoose.model("log", logMongooseSchema);

