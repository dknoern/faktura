'use server'

import dbConnect from "@/lib/dbConnect";
import { ApiKey } from "@/lib/models/apiKey";
import { generateApiKey } from "@/lib/api-key-utils";
import { getTenantObjectId } from "@/lib/tenant-utils";
import { getShortUser } from "@/lib/auth-utils";

export async function createApiKey(label: string): Promise<{ raw: string; id: string }> {
  if (!label?.trim()) throw new Error("Label is required");

  await dbConnect();
  const tenantObjectId = await getTenantObjectId();
  const createdBy = await getShortUser();
  const { raw, hash } = generateApiKey();

  const apiKey = await ApiKey.create({
    label: label.trim(),
    keyHash: hash,
    tenantId: tenantObjectId,
    createdBy,
    createdAt: new Date(),
  });

  return { raw, id: apiKey._id.toString() };
}

export async function listApiKeys(): Promise<
  Array<{ id: string; label: string; createdBy: string | null; createdAt: Date; lastUsedAt: Date | null }>
> {
  await dbConnect();
  const tenantObjectId = await getTenantObjectId();

  const keys = await ApiKey.find({ tenantId: tenantObjectId })
    .sort({ createdAt: -1 })
    .select("-keyHash");

  return JSON.parse(JSON.stringify(keys)).map((k: any) => ({
    id: k._id,
    label: k.label,
    createdBy: k.createdBy ?? null,
    createdAt: k.createdAt,
    lastUsedAt: k.lastUsedAt ?? null,
  }));
}

export async function revokeApiKey(id: string): Promise<void> {
  await dbConnect();
  const tenantObjectId = await getTenantObjectId();

  const result = await ApiKey.findOneAndDelete({ _id: id, tenantId: tenantObjectId });
  if (!result) throw new Error("Not found");
}
