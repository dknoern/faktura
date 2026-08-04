"use server";

import dbConnect from "@/lib/dbConnect";
import { Payment } from "@/lib/models/payment";
import { getTenantObjectId } from "@/lib/tenant-utils";
import mongoose from "mongoose";

export interface PaymentRecord {
  _id: string;
  invoiceId: string;
  date: string;
  amount: number;
  method: "cash" | "check" | "credit_card" | "ach";
  notes?: string;
  createdAt: string;
}

export interface CreatePaymentData {
  invoiceId: string;
  date: string;
  amount: number;
  method: "cash" | "check" | "credit_card" | "ach";
  notes?: string;
}

export async function getPaymentsForInvoice(
  invoiceId: string
): Promise<PaymentRecord[]> {
  await dbConnect();
  const tenantObjectId = await getTenantObjectId();

  const payments = await Payment.find({
    tenantId: tenantObjectId,
    invoiceId: new mongoose.Types.ObjectId(invoiceId),
  })
    .sort({ date: 1, createdAt: 1 })
    .lean();

  return payments.map((p: any) => ({
    _id: p._id.toString(),
    invoiceId: p.invoiceId.toString(),
    date: p.date instanceof Date ? p.date.toISOString() : String(p.date),
    amount: p.amount,
    method: p.method,
    notes: p.notes,
    createdAt:
      p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
  }));
}

export async function createPayment(
  data: CreatePaymentData
): Promise<{ success: boolean; payment?: PaymentRecord; error?: string }> {
  if (!data.invoiceId) return { success: false, error: "Invoice ID is required" };
  if (!data.amount || data.amount <= 0) return { success: false, error: "Amount must be greater than zero" };
  if (!data.date) return { success: false, error: "Date is required" };
  if (!["cash", "check", "credit_card", "ach"].includes(data.method)) {
    return { success: false, error: "Invalid payment method" };
  }

  await dbConnect();
  const tenantObjectId = await getTenantObjectId();

  const payment = await Payment.create({
    tenantId: tenantObjectId,
    invoiceId: new mongoose.Types.ObjectId(data.invoiceId),
    date: new Date(data.date),
    amount: data.amount,
    method: data.method,
    notes: data.notes || undefined,
  });

  return {
    success: true,
    payment: {
      _id: payment._id.toString(),
      invoiceId: payment.invoiceId.toString(),
      date: payment.date.toISOString(),
      amount: payment.amount,
      method: payment.method,
      notes: payment.notes,
      createdAt: payment.createdAt.toISOString(),
    },
  };
}

export async function getPaymentTotalsForInvoices(
  invoiceIds: string[]
): Promise<Record<string, number>> {
  if (invoiceIds.length === 0) return {};

  await dbConnect();
  const tenantObjectId = await getTenantObjectId();

  const results = await Payment.aggregate([
    {
      $match: {
        tenantId: tenantObjectId,
        invoiceId: { $in: invoiceIds.map((id) => new mongoose.Types.ObjectId(id)) },
      },
    },
    {
      $group: {
        _id: "$invoiceId",
        totalPaid: { $sum: "$amount" },
      },
    },
  ]);

  const totals: Record<string, number> = {};
  for (const r of results) {
    totals[r._id.toString()] = r.totalPaid;
  }
  return totals;
}

export async function deletePayment(
  paymentId: string
): Promise<{ success: boolean; error?: string }> {
  await dbConnect();
  const tenantObjectId = await getTenantObjectId();

  const result = await Payment.deleteOne({
    _id: new mongoose.Types.ObjectId(paymentId),
    tenantId: tenantObjectId,
  });

  if (result.deletedCount === 0) {
    return { success: false, error: "Payment not found" };
  }
  return { success: true };
}
