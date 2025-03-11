import { z } from "zod";
import { extendZod } from "@zodyac/zod-mongoose";
import zodToMongoose from "@zodyac/zod-mongoose";
import mongoose from "mongoose";

extendZod(z);

export const productSchema = z.object({
  firstName: z.string().min(3).max(255),
  lastName: z.string().min(3).max(255),

    itemNumber: z.string().min(3).max(255),
    productType: z.string().min(3).max(255),
    manufacturer: z.string().min(3).max(255),
    title: z.string().min(3).max(255),
    paymentMethod: z.string().min(3).max(255),
    paymentDetails: z.string().min(3).max(255),
    modelNumber: z.string().min(3).max(255),
    model: z.string().min(3).max(255),
    condition: z.string().min(3).max(255),
    gender: z.string().min(3).max(255),
    features: z.string().min(3).max(255),
    case: z.string().min(3).max(255),
    size: z.string().min(3).max(255),
    dial: z.string().min(3).max(255),
    bracelet: z.string().min(3).max(255),
    comments: z.string().min(3).max(255),
    serialNo: z.string().min(3).max(255),
    longDesc: z.string().min(3).max(255),
    lastUpdated: z.date(),
    cost: z.number(),
    listPrice: z.number(),
    totalRepairCost: z.number(),
    sellingPrice: z.number(),
    received: z.date(),
    status: z.string().min(3).max(255),
    notes: z.string().min(3).max(255),
    ebayNoReserve: z.boolean(),
    inventoryItem:z.boolean(),
    sellerType: z.string().min(3).max(255),
    seller:z.string().min(3).max(255),
    search: z.string().min(3).max(255),
    history: z.array(z.object({
        _id: z.string(),
        user: z.string().min(3).max(255),
        date: z.date(),
        action: z.string().min(3).max(255),
        itemReceived: z.string().min(3).max(255),
        receivedFrom: z.string().min(3).max(255),
        customerName: z.string().min(3).max(255),
        comments: z.string().min(3).max(255),
        search: z.string().min(3).max(255),
        repairNumber: z.string().min(3).max(255),
        repairCost: z.number(),
        refDoc: z.string().min(3).max(255),
    }))
});

const productMongooseSchema = zodToMongoose(productSchema);
export const productModel = mongoose.models?.product || mongoose.model("product", productMongooseSchema);

