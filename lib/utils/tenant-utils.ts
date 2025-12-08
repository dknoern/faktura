import { Counter } from "../models/counter";
import mongoose from "mongoose";

export async function getNextSequence(tenantId: string | mongoose.Types.ObjectId, modelName: string): Promise<number> {
    const counter = await Counter.findOneAndUpdate(
        { tenant: tenantId, model: modelName },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return counter.seq;
}
