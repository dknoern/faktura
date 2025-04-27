import { z } from "zod";
import { extendZod } from "@zodyac/zod-mongoose";
import zodToMongoose from "@zodyac/zod-mongoose";
import mongoose from "mongoose";

extendZod(z);

export const productSchema = z.object({
    id: z.string(),
    itemNumber: z.string().min(3).max(255),
    productType: z.string().min(3).max(255),
    manufacturer: z.string().optional(),
    title: z.string().min(3).max(255),
    paymentMethod: z.string().optional(),
    paymentDetails: z.string().optional(),
    modelNumber: z.string().optional(),
    model: z.string().optional(),
    condition: z.string().optional(),
    gender: z.string().optional(),
    features: z.string().optional(),
    case: z.string().optional(),
    size: z.string().optional(),
    dial: z.string().optional(),
    bracelet: z.string().optional(),
    comments: z.string().optional(),
    serialNo: z.string().optional(),
    longDesc: z.string().optional(),
    lastUpdated: z.date().optional(),
    cost: z.number().optional(),
    listPrice: z.number().optional(),
    totalRepairCost: z.number().optional(),
    sellingPrice: z.number().optional(),
    totalCost: z.number().optional(),
    received: z.date().optional(),
    status: z.string().optional(),
    notes: z.string().optional(),
    ebayNoReserve: z.boolean().optional(),
    inventoryItem:z.boolean().optional(),
    sellerType: z.string().min(3).max(255),
    seller:z.string().min(3).max(255),
    search: z.string().optional(),
    history: z.array(z.object({
        _id: z.string(),
        user: z.string().min(3).max(255),
        date: z.date(),
        action: z.string().min(3).max(255),
        itemReceived: z.string(),
        receivedFrom: z.string(),
        customerName: z.string(),
        comments: z.string(),
        search: z.string(),
        repairNumber: z.string(),
        repairCost: z.number(),
        refDoc: z.string(),
    })).optional()
});

const productMongooseSchema = zodToMongoose(productSchema);
export const productModel = mongoose.models?.product || mongoose.model("product", productMongooseSchema);

