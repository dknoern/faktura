'use server'

import dbConnect from "@/lib/dbConnect";
import { timeEntryModel } from "@/lib/models/time";
import { vendorModel } from "@/lib/models/vendor";
import { vendorPaymentModel, vendorPaymentSchema } from "@/lib/models/vendor-payment";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import mongoose from "mongoose";
import { getTenantObjectId, getNextCounter } from "@/lib/tenant-utils";
import { auth } from "@/auth";

type VendorPaymentData = z.infer<typeof vendorPaymentSchema>;

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const payoutInputSchema = z.object({
  method: z.enum(["check", "venmo", "other"], { invalid_type_error: "Select a payment method" }),
  checkNumber: z.string().optional(),
  note: z.string().optional(),
});

export type PayoutInput = z.infer<typeof payoutInputSchema>;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function createVendorPayout(vendorId: string, input: PayoutInput): Promise<ActionResult<VendorPaymentData>> {
  const parsed = payoutInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  if (parsed.data.method === "check" && !parsed.data.checkNumber?.trim()) {
    return {
      success: false,
      error: "Check number is required",
      fieldErrors: { checkNumber: ["Check number is required"] },
    };
  }

  try {
    const session = await auth();
    const user = session?.user as any;
    if (user?.role !== "admin") {
      return { success: false, error: "Forbidden: admin access required" };
    }

    await dbConnect();
    const tenantObjectId = user?.tenantId
      ? new mongoose.Types.ObjectId(String(user.tenantId))
      : await getTenantObjectId();

    const vendor = await vendorModel.findOne({
      _id: vendorId,
      tenantId: tenantObjectId,
      status: { $ne: 'Deleted' },
    });
    if (!vendor) {
      return { success: false, error: "Vendor not found" };
    }

    // Everything approved and not yet part of a payout — totals are always
    // recomputed server-side at submit time
    const entries = await timeEntryModel.find({
      tenantId: tenantObjectId,
      vendorId: vendor._id.toString(),
      status: 'Approved',
    });
    if (entries.length === 0) {
      return { success: false, error: "No approved entries to pay out" };
    }

    const timeEntries = entries.filter((e: any) => (e.entryType ?? 'time') === 'time');
    const expenseEntries = entries.filter((e: any) => e.entryType === 'expense');

    const timeHours = Math.round(timeEntries.reduce((sum: number, e: any) => sum + (e.hours || 0), 0) * 10) / 10;
    const hourlyRate = vendor.hourlyRate;
    if (timeEntries.length > 0 && !(hourlyRate > 0)) {
      return { success: false, error: "Set an hourly rate for this vendor before paying out time entries" };
    }
    const timeAmount = timeEntries.length > 0 ? round2(timeHours * hourlyRate) : 0;
    const expenseAmount = round2(expenseEntries.reduce((sum: number, e: any) => sum + (e.amount || 0), 0));
    const totalAmount = round2(timeAmount + expenseAmount);

    const paidBy = user?.email?.split('@')[0] || 'System';
    const now = new Date();
    const payoutNumber = await getNextCounter('payoutNumber');

    const payment = await vendorPaymentModel.create({
      payoutNumber,
      vendorId: vendor._id.toString(),
      vendorName: `${vendor.firstName} ${vendor.lastName}`.trim(),
      method: parsed.data.method,
      checkNumber: parsed.data.method === "check" ? parsed.data.checkNumber?.trim() : undefined,
      note: parsed.data.note?.trim() || undefined,
      timeHours: timeEntries.length > 0 ? timeHours : undefined,
      hourlyRate: timeEntries.length > 0 ? hourlyRate : undefined,
      timeAmount: timeEntries.length > 0 ? timeAmount : undefined,
      expenseAmount: expenseEntries.length > 0 ? expenseAmount : undefined,
      totalAmount,
      entryCount: entries.length,
      paidBy,
      createdAt: now,
      lastUpdated: now,
      tenantId: tenantObjectId,
    });

    await timeEntryModel.updateMany(
      { _id: { $in: entries.map((e: any) => e._id) }, tenantId: tenantObjectId, status: 'Approved' },
      {
        status: 'Paid',
        paymentId: payment._id.toString(),
        lastUpdated: now,
      }
    );

    revalidatePath('/time');
    revalidatePath('/payouts');
    revalidatePath('/vendors');

    const paymentObj = payment.toObject();
    paymentObj._id = paymentObj._id.toString();
    if (paymentObj.tenantId) paymentObj.tenantId = paymentObj.tenantId.toString();
    return { success: true, data: JSON.parse(JSON.stringify(paymentObj)) };
  } catch (error) {
    console.error("Error creating vendor payout:", error);
    return { success: false, error: "Failed to complete payout" };
  }
}
