import mongoose from "mongoose";

var CounterSchema = new mongoose.Schema({
    _id: { type: String }, // Optional now, for backward compatibility or migration
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
    model: { type: String },
    seq: { type: Number, default: 0 }
});

// Compound index for tenant-scoped counters
CounterSchema.index({ tenant: 1, model: 1 }, { unique: true, partialFilterExpression: { tenant: { $exists: true } } });

export const Counter = mongoose.models.Counter || mongoose.model('Counter', CounterSchema);
