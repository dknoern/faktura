import mongoose from "mongoose";
import { Counter } from "./models/counter";
import { getTenantId } from "./auth-utils";

/**
 * Get the current tenant's ObjectId.
 */
export async function getTenantObjectId(): Promise<mongoose.Types.ObjectId> {
  const tenantId = await getTenantId();
  return new mongoose.Types.ObjectId(tenantId);
}

/**
 * Atomically increment a tenant-scoped counter and return the new value.
 * Counter documents are keyed by `{counterName}_{tenantId}`.
 */
export async function getNextCounter(counterName: string): Promise<number> {
  const tenantId = await getTenantId();
  const tenantObjectId = new mongoose.Types.ObjectId(tenantId);
  const key = `${counterName}_${tenantId}`;

  const counter = await Counter.findOneAndUpdate(
    { _id: key, tenantId: tenantObjectId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return counter.seq;
}

/**
 * Get the current value of a tenant-scoped counter without incrementing.
 */
export async function getCurrentCounter(counterName: string): Promise<number> {
  const tenantId = await getTenantId();
  const key = `${counterName}_${tenantId}`;

  const counter = await Counter.findOne({ _id: key });
  return counter?.seq || 0;
}

/**
 * Set a tenant-scoped counter to a specific value (used when user provides a higher number).
 */
export async function setCounter(counterName: string, value: number): Promise<void> {
  const tenantId = await getTenantId();
  const tenantObjectId = new mongoose.Types.ObjectId(tenantId);
  const key = `${counterName}_${tenantId}`;

  await Counter.findOneAndUpdate(
    { _id: key, tenantId: tenantObjectId },
    { seq: value },
    { upsert: true }
  );
}

/**
 * Add tenantId filter to an existing query object.
 * Merges the tenantId condition into the query using $and.
 */
export function addTenantFilter(query: any, tenantObjectId: mongoose.Types.ObjectId): any {
  const tenantCondition = { tenantId: tenantObjectId };
  
  if (!query || Object.keys(query).length === 0) {
    return tenantCondition;
  }
  
  // If query already has $and, push the tenant condition
  if (query.$and) {
    return {
      ...query,
      $and: [...query.$and, tenantCondition]
    };
  }
  
  // Otherwise wrap in $and
  return {
    $and: [query, tenantCondition]
  };
}
