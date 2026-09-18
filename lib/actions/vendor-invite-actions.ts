'use server'

// Public (unauthenticated) actions backing the vendor invite-acceptance page.
// Authorization comes from the emailed single-use token, not a session, so
// vendors are looked up by id alone — never via the session tenant context.

import { timingSafeEqual } from "crypto";
import { z } from "zod";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import { vendorModel } from "@/lib/models/vendor";
import { Tenant } from "@/lib/models/tenant";
import { hashInviteToken } from "@/lib/vendor-invite-utils";
import {
  Auth0ManagementError,
  markAuth0UserEmailVerified,
  updateAuth0UserPassword,
} from "@/lib/auth0/management";

export type VendorInviteInfo = {
  status: 'valid' | 'accepted' | 'expired' | 'invalid';
  email?: string;
  firstName?: string;
  tenantName?: string;
};

function tokenMatches(token: string, storedHash: string | undefined | null): boolean {
  if (!storedHash) return false;
  const provided = Buffer.from(hashInviteToken(token), "hex");
  const stored = Buffer.from(storedHash, "hex");
  return provided.length === stored.length && timingSafeEqual(provided, stored);
}

async function findVendorForInvite(vendorId: string) {
  if (!mongoose.Types.ObjectId.isValid(vendorId)) return null;
  await dbConnect();
  return vendorModel
    .findOne({ _id: vendorId, status: { $ne: 'Deleted' } })
    .select('+inviteTokenHash');
}

export async function getVendorInviteInfo(vendorId: string, token: string): Promise<VendorInviteInfo> {
  try {
    const vendor = await findVendorForInvite(vendorId);
    if (!vendor || !vendor.auth0UserId) {
      return { status: 'invalid' };
    }

    if (vendor.acceptedAt) {
      return { status: 'accepted', email: vendor.email, firstName: vendor.firstName };
    }

    if (!tokenMatches(token, vendor.get('inviteTokenHash'))) {
      return { status: 'invalid' };
    }

    const expiresAt = vendor.get('inviteTokenExpiresAt');
    if (!expiresAt || new Date(expiresAt).getTime() < Date.now()) {
      return { status: 'expired', firstName: vendor.firstName };
    }

    const tenant = await Tenant.findOne({ _id: vendor.tenantId });
    return {
      status: 'valid',
      email: vendor.email,
      firstName: vendor.firstName,
      tenantName: tenant?.name || "your business partner",
    };
  } catch (error) {
    console.error("Error loading vendor invite info:", error);
    return { status: 'invalid' };
  }
}

const acceptInviteSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type AcceptVendorInviteResult = {
  success: boolean;
  data?: { email: string };
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function acceptVendorInvite(
  vendorId: string,
  token: string,
  input: { password: string; confirmPassword: string }
): Promise<AcceptVendorInviteResult> {
  const parsed = acceptInviteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const vendor = await findVendorForInvite(vendorId);
    if (!vendor || !vendor.auth0UserId) {
      return { success: false, error: "This invitation is not valid." };
    }
    if (vendor.acceptedAt) {
      return { success: false, error: "This invitation has already been accepted. Please sign in." };
    }
    if (!tokenMatches(token, vendor.get('inviteTokenHash'))) {
      return { success: false, error: "This invitation is not valid." };
    }
    const expiresAt = vendor.get('inviteTokenExpiresAt');
    if (!expiresAt || new Date(expiresAt).getTime() < Date.now()) {
      return { success: false, error: "This invitation has expired. Please ask for a new one." };
    }

    // Completing the emailed link proves ownership of the address
    await markAuth0UserEmailVerified(vendor.auth0UserId);

    try {
      await updateAuth0UserPassword(vendor.auth0UserId, parsed.data.password);
    } catch (error) {
      if (error instanceof Auth0ManagementError && error.status === 400) {
        // Surface Auth0's password-policy message (e.g. "Password is too weak")
        // and keep the token valid so the vendor can try again
        return {
          success: false,
          error: error.message,
          fieldErrors: { password: [error.message] },
        };
      }
      throw error;
    }

    vendor.acceptedAt = new Date();
    vendor.set('inviteTokenHash', undefined);
    vendor.set('inviteTokenExpiresAt', undefined);
    vendor.lastUpdated = new Date();
    await vendor.save();

    return { success: true, data: { email: vendor.email } };
  } catch (error) {
    console.error("Error accepting vendor invite:", error);
    return { success: false, error: "Something went wrong activating your account. Please try again." };
  }
}
