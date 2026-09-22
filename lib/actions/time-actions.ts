'use server'

import { randomUUID } from "crypto";
import dbConnect from "@/lib/dbConnect";
import { timeEntryModel, timeEntrySchema } from "@/lib/models/time";
import { vendorModel } from "@/lib/models/vendor";
import { Proposal } from "@/lib/models/proposal";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import mongoose from "mongoose";
import { getTenantObjectId } from "@/lib/tenant-utils";
import { getShortUser } from "@/lib/auth-utils";
import { saveFile } from "@/lib/utils/storage";
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

const expenseInputSchema = z.object({
  proposalId: z.string().min(1, "Project is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date"),
  amount: z.number({ invalid_type_error: "Enter an amount" }),
  description: z.string().min(1, "Description is required"),
  comment: z.string().optional(),
  vendorId: z.string().optional(),
});

const RECEIPT_MAX_BYTES = 10 * 1024 * 1024;
const RECEIPT_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'pdf'];

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

type EntryActor =
  | { ok: true; isAdmin: boolean; vendor: any; tenantObjectId: mongoose.Types.ObjectId; enteredBy: string }
  | { ok: false; result: ActionResult<never> };

// Resolves who the entry belongs to: vendors always log against their own
// profile (matched by account email); admins pick the vendor explicitly.
// Tenant and user identity come from the session, NOT the proxy headers —
// multipart/form-data posts (expense receipts) skip the proxy's header
// injection, so header-derived tenant context would fall back to the default.
async function resolveEntryActor(vendorIdInput?: string): Promise<EntryActor> {
  const session = await auth();
  const user = session?.user as any;
  const isAdmin = user?.role === "admin";
  const isVendor = user?.role === "vendor" || user?.userType === "vendor";

  if (!isAdmin && !isVendor) {
    return { ok: false, result: { success: false, error: "Only vendors and admins can create entries" } };
  }

  await dbConnect();
  const tenantObjectId = user?.tenantId
    ? new mongoose.Types.ObjectId(String(user.tenantId))
    : await getTenantObjectId();
  const enteredBy = user?.email?.split('@')[0] || await getShortUser();

  let vendor;
  if (isVendor) {
    vendor = await vendorModel.findOne({
      tenantId: tenantObjectId,
      email: user?.email,
      status: { $ne: 'Deleted' },
    });
    if (!vendor) {
      return {
        ok: false,
        result: { success: false, error: "No vendor profile is linked to your account. Please contact your administrator." },
      };
    }
  } else {
    if (!vendorIdInput) {
      return {
        ok: false,
        result: {
          success: false,
          error: "Please select a vendor",
          fieldErrors: { vendorId: ["Please select a vendor"] },
        },
      };
    }
    vendor = await vendorModel.findOne({
      _id: vendorIdInput,
      tenantId: tenantObjectId,
      status: { $ne: 'Deleted' },
    });
    if (!vendor) {
      return { ok: false, result: { success: false, error: "Vendor not found" } };
    }
  }

  return { ok: true, isAdmin, vendor, tenantObjectId, enteredBy };
}

async function resolveProject(proposalId: string, tenantObjectId: mongoose.Types.ObjectId) {
  const proposal = await Proposal.findOne({ _id: proposalId, tenantId: tenantObjectId });
  if (!proposal) return null;
  const projectName = proposal.project?.trim() ||
    `${proposal.customerFirstName ?? ''} ${proposal.customerLastName ?? ''}`.trim() ||
    'Proposal';
  return { proposal, projectName };
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
    const actor = await resolveEntryActor(parsed.data.vendorId);
    if (!actor.ok) return actor.result;
    const { isAdmin, vendor, tenantObjectId, enteredBy } = actor;

    const project = await resolveProject(parsed.data.proposalId, tenantObjectId);
    if (!project) {
      return { success: false, error: "Project not found" };
    }

    const now = new Date();
    const entry = await timeEntryModel.create({
      entryType: "time",
      vendorId: vendor._id.toString(),
      vendorName: `${vendor.firstName} ${vendor.lastName}`.trim(),
      proposalId: project.proposal._id.toString(),
      projectName: project.projectName,
      date: parsed.data.date,
      hours,
      comment: parsed.data.comment?.trim() || undefined,
      // Admin-entered entries are approved immediately; vendor entries await review
      status: isAdmin ? "Approved" : "Pending",
      enteredBy,
      enteredByRole: isAdmin ? "admin" : "vendor",
      ...(isAdmin ? { reviewedBy: enteredBy, reviewedAt: now } : {}),
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

// Expenses arrive as FormData so the optional receipt file can ride along
// through a server action (vendors can't reach the generic upload API routes)
export async function createExpenseEntry(formData: FormData): Promise<ActionResult<TimeEntryData>> {
  const rawAmount = String(formData.get('amount') ?? '');
  const parsed = expenseInputSchema.safeParse({
    proposalId: String(formData.get('proposalId') ?? ''),
    date: String(formData.get('date') ?? ''),
    amount: rawAmount === '' ? undefined : Number(rawAmount),
    description: String(formData.get('description') ?? '').trim(),
    comment: String(formData.get('comment') ?? '').trim() || undefined,
    vendorId: String(formData.get('vendorId') ?? '') || undefined,
  });
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const amount = Math.round(parsed.data.amount * 100) / 100;
  if (!(amount > 0) || amount > 1_000_000) {
    return {
      success: false,
      error: "Amount must be greater than $0",
      fieldErrors: { amount: ["Amount must be greater than $0"] },
    };
  }

  try {
    const actor = await resolveEntryActor(parsed.data.vendorId);
    if (!actor.ok) return actor.result;
    const { isAdmin, vendor, tenantObjectId, enteredBy } = actor;

    const project = await resolveProject(parsed.data.proposalId, tenantObjectId);
    if (!project) {
      return { success: false, error: "Project not found" };
    }

    // Optional receipt upload
    let receipt;
    const file = formData.get('receipt');
    if (file instanceof File && file.size > 0) {
      if (file.size > RECEIPT_MAX_BYTES) {
        return {
          success: false,
          error: "Receipt file must be 10MB or smaller",
          fieldErrors: { receipt: ["Receipt file must be 10MB or smaller"] },
        };
      }
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      if (!RECEIPT_EXTENSIONS.includes(ext)) {
        return {
          success: false,
          error: "Receipt must be an image or PDF",
          fieldErrors: { receipt: ["Receipt must be an image or PDF"] },
        };
      }
      const fileName = `receipt-${randomUUID()}.${ext}`;
      await saveFile(Buffer.from(await file.arrayBuffer()), fileName);
      receipt = {
        fileName,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        uploadDate: new Date(),
      };
    }

    const now = new Date();
    const entry = await timeEntryModel.create({
      entryType: "expense",
      vendorId: vendor._id.toString(),
      vendorName: `${vendor.firstName} ${vendor.lastName}`.trim(),
      proposalId: project.proposal._id.toString(),
      projectName: project.projectName,
      date: parsed.data.date,
      amount,
      description: parsed.data.description,
      receipt,
      comment: parsed.data.comment,
      status: isAdmin ? "Approved" : "Pending",
      enteredBy,
      enteredByRole: isAdmin ? "admin" : "vendor",
      ...(isAdmin ? { reviewedBy: enteredBy, reviewedAt: now } : {}),
      createdAt: now,
      lastUpdated: now,
      tenantId: tenantObjectId,
    });

    revalidatePath('/time');
    return { success: true, data: serializeTimeEntry(entry) };
  } catch (error) {
    console.error("Error creating expense entry:", error);
    return { success: false, error: "Failed to save expense entry" };
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
      return { success: false, error: "Entry not found" };
    }

    revalidatePath('/time');
    return { success: true, data: serializeTimeEntry(entry) };
  } catch (error) {
    console.error(`Error setting entry to ${status}:`, error);
    return { success: false, error: `Failed to ${status === "Approved" ? "approve" : "reject"} entry` };
  }
}

export async function approveTimeEntry(id: string): Promise<ActionResult<TimeEntryData>> {
  return reviewTimeEntry(id, "Approved");
}

export async function rejectTimeEntry(id: string): Promise<ActionResult<TimeEntryData>> {
  return reviewTimeEntry(id, "Rejected");
}
