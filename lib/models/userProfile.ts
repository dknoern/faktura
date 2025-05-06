import { z } from "zod";
import { extendZod } from "@zodyac/zod-mongoose";
import zodToMongoose from "@zodyac/zod-mongoose";
import mongoose from "mongoose";

extendZod(z);

export const userProfileSchema = z.object({
    userId: z.string().min(1).max(255),
    name: z.string().optional(),
    title: z.string().optional(),
    interests: z.string().optional(),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
});

const userProfileMongooseSchema = zodToMongoose(userProfileSchema);
export const userProfileModel = mongoose.models?.userProfile || mongoose.model("userProfile", userProfileMongooseSchema);