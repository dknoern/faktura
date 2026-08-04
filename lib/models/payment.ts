import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    method: {
      type: String,
      required: true,
      enum: ["cash", "check", "credit_card", "ach"],
    },
    notes: { type: String },
    stripeSessionId: { type: String, sparse: true, index: true },
  },
  { timestamps: true }
);

export const Payment =
  mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
