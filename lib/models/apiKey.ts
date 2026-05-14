import { z } from "zod";
import { extendZod, zodSchema } from "@zodyac/zod-mongoose";
import mongoose, { model } from "mongoose";

extendZod(z);

const apiKeyBaseSchema = z.object({
  label: z.string().min(1).max(255),
  keyHash: z.string(),
  tenantId: z.any(),
  createdBy: z.string().optional(),
  createdAt: z.date().optional(),
  lastUsedAt: z.date().optional(),
});

export const apiKeySchema = apiKeyBaseSchema.extend({
  _id: z.any().optional(),
});

export type ApiKeyData = z.infer<typeof apiKeySchema>;

const apiKeyMongooseSchema = zodSchema(apiKeyBaseSchema);

(apiKeyMongooseSchema as any).add({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  createdAt: { type: Date, default: Date.now },
  lastUsedAt: { type: Date },
});

apiKeyMongooseSchema.index({ keyHash: 1 });
apiKeyMongooseSchema.index({ tenantId: 1 });

export const ApiKey = mongoose.models.ApiKey || model("ApiKey", apiKeyMongooseSchema);
