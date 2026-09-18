'use server'

import { z } from "zod";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import dbConnect from "@/lib/dbConnect";
import { Tenant } from "@/lib/models/tenant";
import { formatFromAddress } from "@/lib/utils/email-from";
import {
  Auth0ManagementError,
  Auth0User,
  createAuth0User,
  createEmailVerificationTicket,
  deleteAuth0User,
  findUserByEmail,
  patchAuth0UserAppMetadata,
} from "@/lib/auth0/management";

function getAppBaseUrl(): string {
  return process.env.AUTH_URL || "http://localhost:3000";
}

function buildVerifiedResultUrl(email: string): string {
  return `${getAppBaseUrl()}/signup/verified?email=${encodeURIComponent(email)}`;
}

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const signUpSchema = z
  .object({
    email: z.string().email("Enter a valid email address"),
    tenantName: z.string().min(1, "Business name is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;

const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function sendVerificationEmail(to: string, ticketUrl: string): Promise<void> {
  if (!process.env.SIGNUP_EMAIL_FROM) {
    throw new Error("SIGNUP_EMAIL_FROM environment variable is not configured");
  }
  const source = formatFromAddress("Fakturian", process.env.SIGNUP_EMAIL_FROM);

  const command = new SendEmailCommand({
    Source: source,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: "Verify your email to finish creating your account", Charset: "UTF-8" },
      Body: {
        Text: {
          Data: [
            `Welcome to Fakturian!`,
            ``,
            `Open the link below to verify your email address and finish setting up your account:`,
            ``,
            ticketUrl,
            ``,
            `If you didn't create a Fakturian account, you can ignore this email.`,
            ``,
            `— The Fakturian team`,
          ].join("\n"),
          Charset: "UTF-8",
        },
        Html: {
          Data: `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0; padding:24px; background-color:#f6f6f6; font-family: Arial, Helvetica, sans-serif; color:#222222;">
    <div style="max-width:520px; margin:0 auto; background-color:#ffffff; border-radius:8px; padding:32px;">
      <h1 style="font-size:20px; margin:0 0 16px;">Welcome to Fakturian!</h1>
      <p style="font-size:14px; line-height:1.6; margin:0 0 24px;">
        Verify your email address using the button below to finish setting up your account.
      </p>
      <p style="text-align:center; margin:0 0 24px;">
        <a href="${ticketUrl}"
           style="display:inline-block; background-color:#2563eb; color:#ffffff; text-decoration:none; font-size:14px; padding:12px 24px; border-radius:6px;">
          Verify your email
        </a>
      </p>
      <p style="font-size:12px; line-height:1.6; color:#555555; margin:0;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${ticketUrl}" style="color:#2563eb; word-break:break-all;">${ticketUrl}</a>
      </p>
    </div>
    <p style="max-width:520px; margin:16px auto 0; font-size:11px; line-height:1.5; color:#888888; text-align:center;">
      You're receiving this email because ${to} was used to create a Fakturian account.
      If you didn't sign up, you can ignore this email.
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

export async function signUp(data: SignUpInput): Promise<ActionResult<{ email: string }>> {
  const parsed = signUpSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, tenantName, password } = parsed.data;

  let auth0User: Auth0User;
  try {
    auth0User = await createAuth0User({ email, password, tenantName, role: "admin" });
  } catch (error) {
    if (error instanceof Auth0ManagementError && error.status === 409) {
      return {
        success: false,
        error: "An account with this email already exists.",
        fieldErrors: {
          email: ["An account with this email already exists. Resend the verification email instead."],
        },
      };
    }
    console.error("Error creating Auth0 user during sign up:", error);
    return { success: false, error: "Failed to create account" };
  }

  let tenant;
  try {
    await dbConnect();
    tenant = await Tenant.create({ name: tenantName, email });

    const tenantId = tenant._id.toString();
    await patchAuth0UserAppMetadata(auth0User.user_id, { tenantId, tenantName, role: "admin" });

    const ticketUrl = await createEmailVerificationTicket(auth0User.user_id, buildVerifiedResultUrl(email));

    await sendVerificationEmail(email, ticketUrl);

    return { success: true, data: { email } };
  } catch (error) {
    console.error("Error finishing sign up, rolling back:", error);
    const [auth0Rollback, tenantRollback] = await Promise.allSettled([
      deleteAuth0User(auth0User.user_id),
      tenant ? Tenant.deleteOne({ _id: tenant._id }) : Promise.resolve(),
    ]);
    if (auth0Rollback.status === "rejected") {
      console.error(
        `Failed to roll back orphaned Auth0 user ${auth0User.user_id} (${email}):`,
        auth0Rollback.reason
      );
    }
    if (tenantRollback.status === "rejected") {
      console.error(`Failed to roll back tenant ${tenant?._id}:`, tenantRollback.reason);
    }
    return { success: false, error: "Failed to complete sign up" };
  }
}

export async function resendVerificationEmail(email: string): Promise<ActionResult<null>> {
  const parsedEmail = z.string().email().safeParse(email);
  if (!parsedEmail.success) {
    return { success: false, error: "Enter a valid email address" };
  }

  try {
    const user = await findUserByEmail(parsedEmail.data);
    if (!user) {
      return { success: false, error: "No account found for that email" };
    }
    if (user.email_verified) {
      return { success: false, error: "This email is already verified. Please sign in." };
    }

    const ticketUrl = await createEmailVerificationTicket(user.user_id, buildVerifiedResultUrl(parsedEmail.data));
    await sendVerificationEmail(parsedEmail.data, ticketUrl);

    return { success: true, data: null };
  } catch (error) {
    console.error("Error resending verification email:", error);
    return { success: false, error: "Failed to resend verification email" };
  }
}
