'use server'

import dbConnect from "@/lib/dbConnect";
import { timeEntryModel, timeEntrySchema } from "@/lib/models/time";
import { vendorModel } from "@/lib/models/vendor";
import { Proposal } from "@/lib/models/proposal";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getTenantObjectId } from "@/lib/tenant-utils";
import { getShortUser } from "@/lib/auth-utils";
import { auth } from "@/auth";

type TimeEntryData = z.infer<typeof timeEntrySchema>;

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const timeEntryInputSchema = z.object({
  proposalId: z.string().min(1, "Project is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date"),
  hours: z.number({ invalid_type_error: "Enter the number of hours" }),
  comment: z.string().optional(),
  // Required when an admin enters time on behalf of a vendor
  vendorId: z.string().optional(),
});

export type TimeEntryInput = z.infer<typeof timeEntryInputSchema>;

function serializeTimeEntry(entry: any): TimeEntryData {
  const obj = entry.toObject();
  obj._id = obj._id.toString();
  if (obj.tenantId) obj.tenantId = obj.tenantId.toString();
  return JSON.parse(JSON.stringify(obj));
}

async function requireAdmin(): Promise<void> {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "admin") throw new Error("Forbidden: admin access required");
}

export async function createTimeEntry(input: TimeEntryInput): Promise<ActionResult<TimeEntryData>> {
  const parsed = timeEntryInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // Hours are tracked to a resolution of 0.1
  const hours = Math.round(parsed.data.hours * 10) / 10;
  if (hours < 0.1 || hours > 24) {
    return {
      success: false,
      error: "Hours must be between 0.1 and 24",
      fieldErrors: { hours: ["Hours must be between 0.1 and 24"] },
    };
  }

  try {
    const session = await auth();
    const user = session?.user as any;
    const isAdmin = user?.role === "admin";
    const isVendor = user?.role === "vendor" || user?.userType === "vendor";

    if (!isAdmin && !isVendor) {
      return { success: false, error: "Only vendors and admins can enter time" };
    }

    await dbConnect();
    const tenantObjectId = await getTenantObjectId();

    // Resolve which vendor this entry belongs to
    let vendor;
    if (isVendor) {
      vendor = await vendorModel.findOne({
        tenantId: tenantObjectId,
        email: user?.email,
        status: { $ne: 'Deleted' },
      });
      if (!vendor) {
        return { success: false, error: "No vendor profile is linked to your account. Please contact your administrator." };
      }
    } else {
      if (!parsed.data.vendorId) {
        return {
          success: false,
          error: "Please select a vendor",
          fieldErrors: { vendorId: ["Please select a vendor"] },
        };
      }
      vendor = await vendorModel.findOne({
        _id: parsed.data.vendorId,
        tenantId: tenantObjectId,
        status: { $ne: 'Deleted' },
      });
      if (!vendor) {
        return { success: false, error: "Vendor not found" };
      }
    }

    const proposal = await Proposal.findOne({ _id: parsed.data.proposalId, tenantId: tenantObjectId });
    if (!proposal) {
      return { success: false, error: "Project not found" };
    }
    const projectName = proposal.project?.trim() ||
      `${proposal.customerFirstName ?? ''} ${proposal.customerLastName ?? ''}`.trim() ||
      'Proposal';

    const now = new Date();
    const entry = await timeEntryModel.create({
      vendorId: vendor._id.toString(),
      vendorName: `${vendor.firstName} ${vendor.lastName}`.trim(),
      proposalId: proposal._id.toString(),
      projectName,
      date: parsed.data.date,
      hours,
      comment: parsed.data.comment?.trim() || undefined,
      // Admin-entered time is approved immediately; vendor-entered time awaits review
      status: isAdmin ? "Approved" : "Pending",
      enteredBy: await getShortUser(),
      enteredByRole: isAdmin ? "admin" : "vendor",
      ...(isAdmin ? { reviewedBy: await getShortUser(), reviewedAt: now } : {}),
      createdAt: now,
      lastUpdated: now,
      tenantId: tenantObjectId,
    });

    revalidatePath('/time');
    return { success: true, data: serializeTimeEntry(entry) };
  } catch (error) {
    console.error("Error creating time entry:", error);
    return { success: false, error: "Failed to save time entry" };
  }
}

async function reviewTimeEntry(id: string, status: "Approved" | "Rejected"): Promise<ActionResult<TimeEntryData>> {
  try {
    await requireAdmin();
    await dbConnect();
    const tenantObjectId = await getTenantObjectId();

    const entry = await timeEntryModel.findOneAndUpdate(
      { _id: id, tenantId: tenantObjectId },
      {
        status,
        reviewedBy: await getShortUser(),
        reviewedAt: new Date(),
        lastUpdated: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!entry) {
      return { success: false, error: "Time entry not found" };
    }

    revalidatePath('/time');
    return { success: true, data: serializeTimeEntry(entry) };
  } catch (error) {
    console.error(`Error setting time entry to ${status}:`, error);
    return { success: false, error: `Failed to ${status === "Approved" ? "approve" : "reject"} time entry` };
  }
}

export async function approveTimeEntry(id: string): Promise<ActionResult<TimeEntryData>> {
  return reviewTimeEntry(id, "Approved");
}

export async function rejectTimeEntry(id: string): Promise<ActionResult<TimeEntryData>> {
  return reviewTimeEntry(id, "Rejected");
}
