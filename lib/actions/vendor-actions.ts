'use server'

import { randomBytes } from "crypto";
import { hashInviteToken, INVITE_TOKEN_TTL_MS } from "@/lib/vendor-invite-utils";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import dbConnect from "@/lib/dbConnect";
import { vendorModel, vendorSchema } from "@/lib/models/vendor";
import { Tenant } from "@/lib/models/tenant";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getNextCounter, getTenantObjectId } from "@/lib/tenant-utils";
import { formatFromAddress } from "@/lib/utils/email-from";
import { auth } from "@/auth";
import {
  Auth0ManagementError,
  Auth0User,
  createAuth0User,
  deleteAuth0User,
  findUserByEmail,
} from "@/lib/auth0/management";

type VendorData = z.infer<typeof vendorSchema>;
type VendorFormData = Omit<VendorData, '_id' | 'lastUpdated' | 'search' | 'vendorNumber' | 'auth0UserId' | 'invitedAt'>;

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const vendorInputSchema = vendorSchema.omit({
  _id: true,
  lastUpdated: true,
  search: true,
  vendorNumber: true,
  auth0UserId: true,
  invitedAt: true,
});

async function requireAdmin(): Promise<void> {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "admin") throw new Error("Forbidden: admin access required");
}

function buildSearch(vendorNumber: number | string, data: { firstName: string; lastName: string; company?: string; email: string; phone: string }): string {
  return `${vendorNumber} ${data.firstName} ${data.lastName} ${data.company ?? ''} ${data.email} ${data.phone}`.toLowerCase();
}

function serializeVendor(vendor: any): VendorData {
  const vendorObj = vendor.toObject();
  vendorObj._id = vendorObj._id.toString();
  if (vendorObj.tenantId) vendorObj.tenantId = vendorObj.tenantId.toString();
  return JSON.parse(JSON.stringify(vendorObj));
}

export async function createVendor(data: VendorFormData): Promise<ActionResult<VendorData>> {
  const parsed = vendorInputSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await dbConnect();

    const newVendorNumber = await getNextCounter('vendorNumber');
    const tenantObjectId = await getTenantObjectId();

    const vendor = await vendorModel.create({
      ...parsed.data,
      vendorNumber: newVendorNumber,
      lastUpdated: new Date(),
      tenantId: tenantObjectId,
      search: buildSearch(newVendorNumber, parsed.data),
    });

    revalidatePath('/vendors');
    return { success: true, data: serializeVendor(vendor) };
  } catch (error) {
    console.error("Error creating vendor:", error);
    return { success: false, error: "Failed to create vendor" };
  }
}

export async function updateVendor(id: string, data: VendorFormData): Promise<ActionResult<VendorData>> {
  const parsed = vendorInputSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await dbConnect();
    const tenantObjectId = await getTenantObjectId();

    const existingVendor = await vendorModel.findOne({ _id: id, tenantId: tenantObjectId });
    if (!existingVendor) {
      return { success: false, error: "Vendor not found" };
    }

    if (existingVendor.auth0UserId && parsed.data.email !== existingVendor.email) {
      return {
        success: false,
        error: "Email cannot be changed after the vendor has been invited as a user.",
        fieldErrors: { email: ["Email cannot be changed after the vendor has been invited as a user."] },
      };
    }

    const vendor = await vendorModel.findOneAndUpdate(
      { _id: id, tenantId: tenantObjectId },
      {
        ...parsed.data,
        lastUpdated: new Date(),
        search: buildSearch(existingVendor.vendorNumber ?? '', parsed.data),
      },
      { new: true, runValidators: true }
    );

    if (!vendor) {
      return { success: false, error: "Vendor not found" };
    }

    revalidatePath('/vendors');
    return { success: true, data: serializeVendor(vendor) };
  } catch (error) {
    console.error("Error updating vendor:", error);
    return { success: false, error: "Failed to update vendor" };
  }
}

export async function deleteVendor(id: string): Promise<ActionResult<null>> {
  try {
    await dbConnect();
    const tenantObjectId = await getTenantObjectId();

    const vendor = await vendorModel.findOne({ _id: id, tenantId: tenantObjectId });
    if (!vendor) {
      return { success: false, error: "Vendor not found" };
    }

    // Deleting an invited vendor revokes their user account, so gate it to admins
    if (vendor.auth0UserId) {
      await requireAdmin();
      try {
        await deleteAuth0User(vendor.auth0UserId);
      } catch (error) {
        if (!(error instanceof Auth0ManagementError && error.status === 404)) {
          console.error("Error deleting vendor's Auth0 user:", error);
          return { success: false, error: "Failed to revoke the vendor's user account" };
        }
      }
    }

    vendor.status = "Deleted";
    vendor.auth0UserId = undefined;
    vendor.invitedAt = undefined;
    vendor.acceptedAt = undefined;
    vendor.set('inviteTokenHash', undefined);
    vendor.set('inviteTokenExpiresAt', undefined);
    vendor.lastUpdated = new Date();
    await vendor.save();

    revalidatePath('/vendors');
    return { success: true, data: null };
  } catch (error) {
    console.error("Error deleting vendor:", error);
    return { success: false, error: "Failed to delete vendor" };
  }
}

function getAppBaseUrl(): string {
  return process.env.AUTH_URL || "http://localhost:3000";
}

const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function sendVendorInviteEmail(to: string, firstName: string, tenantName: string, acceptUrl: string): Promise<void> {
  if (!process.env.SIGNUP_EMAIL_FROM) {
    throw new Error("SIGNUP_EMAIL_FROM environment variable is not configured");
  }
  // Invites are sent on behalf of the tenant — their name is the sender,
  // the platform stays behind the scenes
  const source = formatFromAddress(tenantName, process.env.SIGNUP_EMAIL_FROM);

  const command = new SendEmailCommand({
    Source: source,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: `You've been invited to join ${tenantName}`, Charset: "UTF-8" },
      Body: {
        Text: {
          Data: [
            `Hi ${firstName},`,
            ``,
            `${tenantName} has invited you to join them as a vendor.`,
            ``,
            `To accept the invitation, open the link below and set a password for your account:`,
            ``,
            acceptUrl,
            ``,
            `This invitation expires in 7 days. If you weren't expecting it, you can ignore this email and no account will be activated.`,
            ``,
            `— ${tenantName}`,
          ].join("\n"),
          Charset: "UTF-8",
        },
        Html: {
          Data: `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0; padding:24px; background-color:#f6f6f6; font-family: Arial, Helvetica, sans-serif; color:#222222;">
    <div style="max-width:520px; margin:0 auto; background-color:#ffffff; border-radius:8px; padding:32px;">
      <h1 style="font-size:20px; margin:0 0 16px;">You're invited to join ${tenantName}</h1>
      <p style="font-size:14px; line-height:1.6; margin:0 0 12px;">Hi ${firstName},</p>
      <p style="font-size:14px; line-height:1.6; margin:0 0 12px;">
        <strong>${tenantName}</strong> has invited you to join them as a vendor.
      </p>
      <p style="font-size:14px; line-height:1.6; margin:0 0 24px;">
        To accept the invitation, set a password for your account using the button below.
      </p>
      <p style="text-align:center; margin:0 0 24px;">
        <a href="${acceptUrl}"
           style="display:inline-block; background-color:#2563eb; color:#ffffff; text-decoration:none; font-size:14px; padding:12px 24px; border-radius:6px;">
          Accept invitation
        </a>
      </p>
      <p style="font-size:12px; line-height:1.6; color:#555555; margin:0 0 12px;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${acceptUrl}" style="color:#2563eb; word-break:break-all;">${acceptUrl}</a>
      </p>
      <p style="font-size:12px; line-height:1.6; color:#555555; margin:0;">
        This invitation expires in 7 days.
      </p>
    </div>
    <p style="max-width:520px; margin:16px auto 0; font-size:11px; line-height:1.5; color:#888888; text-align:center;">
      You're receiving this email because ${tenantName} invited ${to} to join them as a vendor.
      If you weren't expecting this invitation, you can ignore this email and no account will be activated.
    </p>
  </body>
</html>`,
          Charset: "UTF-8",
        },
      },
    },
  });

  await sesClient.send(command);
}

// Random throwaway password for the new Auth0 user; the vendor sets their own
// when they accept the invitation. Suffix guarantees the connection's
// complexity policy (upper/lower/digit/special) is always satisfied.
function generateInitialPassword(): string {
  return randomBytes(32).toString("base64url") + "!aA1";
}

function buildAcceptUrl(vendorId: string, token: string): string {
  return `${getAppBaseUrl()}/invite/accept?vid=${vendorId}&token=${token}`;
}

export async function inviteVendor(id: string): Promise<ActionResult<VendorData>> {
  try {
    await requireAdmin();
    await dbConnect();

    const tenantObjectId = await getTenantObjectId();
    const vendor = await vendorModel.findOne({ _id: id, tenantId: tenantObjectId, status: { $ne: 'Deleted' } });
    if (!vendor) {
      return { success: false, error: "Vendor not found" };
    }
    if (vendor.auth0UserId) {
      return { success: false, error: "This vendor has already been invited. Use resend instead." };
    }

    const tenant = await Tenant.findOne({ _id: tenantObjectId });
    if (!tenant) {
      return { success: false, error: "Tenant not found" };
    }
    const tenantName = tenant.name || "your business";

    const existingUser = await findUserByEmail(vendor.email);
    if (existingUser) {
      return { success: false, error: "A user with this email address already exists." };
    }

    let auth0User: Auth0User;
    try {
      auth0User = await createAuth0User({
        email: vendor.email,
        password: generateInitialPassword(),
        tenantName,
        role: "vendor",
        tenantId: tenantObjectId.toString(),
        userType: "vendor",
      });
    } catch (error) {
      if (error instanceof Auth0ManagementError && error.status === 409) {
        return { success: false, error: "A user with this email address already exists." };
      }
      console.error("Error creating Auth0 user for vendor invite:", error);
      return { success: false, error: "Failed to create the vendor's user account" };
    }

    try {
      const token = randomBytes(32).toString("base64url");
      await sendVendorInviteEmail(vendor.email, vendor.firstName, tenantName, buildAcceptUrl(vendor._id.toString(), token));

      vendor.auth0UserId = auth0User.user_id;
      vendor.invitedAt = new Date();
      vendor.set('inviteTokenHash', hashInviteToken(token));
      vendor.set('inviteTokenExpiresAt', new Date(Date.now() + INVITE_TOKEN_TTL_MS));
      vendor.lastUpdated = new Date();
      await vendor.save();

      revalidatePath('/vendors');
      return { success: true, data: serializeVendor(vendor) };
    } catch (error) {
      console.error("Error finishing vendor invite, rolling back Auth0 user:", error);
      try {
        await deleteAuth0User(auth0User.user_id);
      } catch (rollbackError) {
        console.error(
          `Failed to roll back orphaned Auth0 user ${auth0User.user_id} (${vendor.email}):`,
          rollbackError
        );
      }
      return { success: false, error: "Failed to send the invitation" };
    }
  } catch (error) {
    console.error("Error inviting vendor:", error);
    return { success: false, error: "Failed to invite vendor" };
  }
}

export async function resendVendorInvite(id: string): Promise<ActionResult<VendorData>> {
  try {
    await requireAdmin();
    await dbConnect();

    const tenantObjectId = await getTenantObjectId();
    const vendor = await vendorModel.findOne({ _id: id, tenantId: tenantObjectId, status: { $ne: 'Deleted' } });
    if (!vendor) {
      return { success: false, error: "Vendor not found" };
    }
    if (!vendor.auth0UserId) {
      return { success: false, error: "This vendor has not been invited yet." };
    }
    if (vendor.acceptedAt) {
      return { success: false, error: "This vendor has already accepted the invitation." };
    }

    const tenant = await Tenant.findOne({ _id: tenantObjectId });
    const tenantName = tenant?.name || "your business";

    const token = randomBytes(32).toString("base64url");
    await sendVendorInviteEmail(vendor.email, vendor.firstName, tenantName, buildAcceptUrl(vendor._id.toString(), token));

    vendor.invitedAt = new Date();
    vendor.set('inviteTokenHash', hashInviteToken(token));
    vendor.set('inviteTokenExpiresAt', new Date(Date.now() + INVITE_TOKEN_TTL_MS));
    vendor.lastUpdated = new Date();
    await vendor.save();

    revalidatePath('/vendors');
    return { success: true, data: serializeVendor(vendor) };
  } catch (error) {
    console.error("Error resending vendor invite:", error);
    return { success: false, error: "Failed to resend the invitation" };
  }
}
