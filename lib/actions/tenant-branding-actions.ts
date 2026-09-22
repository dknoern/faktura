'use server'

import sharp from "sharp";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import { Tenant } from "@/lib/models/tenant";
import { getTenantId } from "@/lib/auth-utils";
import { auth } from "@/auth";
import { saveImage, deleteImage } from "@/lib/utils/storage";
import { normalizeHostname, isValidDomain } from "@/lib/public-tenant";

const MAX_INPUT_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_WIDTH = 2560; // px — full-screen background

async function requireAdmin(): Promise<void> {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== 'admin') {
    throw new Error('Forbidden: admin access required');
  }
}

// Tenant comes from the session, not the proxy headers — multipart uploads
// skip the proxy's header injection (see multipart-actions-skip-proxy-headers)
async function getSessionTenant(): Promise<{ tenantId: string; tenantObjectId: mongoose.Types.ObjectId }> {
  const session = await auth();
  const sessionTenantId = (session?.user as any)?.tenantId;
  const tenantId = sessionTenantId ? String(sessionTenantId) : await getTenantId();
  return { tenantId, tenantObjectId: new mongoose.Types.ObjectId(tenantId) };
}

function splashFileName(tenantId: string): string {
  return `splash-${tenantId}.jpg`;
}

function buildSplashUrl(tenantId: string, version: string | null | undefined): string {
  const v = version ? encodeURIComponent(version) : `${Date.now()}`;
  return `/api/images/${splashFileName(tenantId)}?v=${v}`;
}

export interface TenantBrandingView {
  customDomain: string;
  hasSplash: boolean;
  splashUrl: string | null;
}

export async function getTenantBrandingSettings(): Promise<TenantBrandingView> {
  await requireAdmin();
  await dbConnect();
  const { tenantId, tenantObjectId } = await getSessionTenant();
  const tenant = await Tenant.findOne({ _id: tenantObjectId })
    .select({ customDomain: 1, splashImage: 1 })
    .lean();

  const splashVersion = (tenant as any)?.splashImage as string | undefined;
  return {
    customDomain: (tenant as any)?.customDomain ?? '',
    hasSplash: !!splashVersion,
    splashUrl: splashVersion ? buildSplashUrl(tenantId, splashVersion) : null,
  };
}

export interface BrandingActionResult {
  success: boolean;
  error?: string;
  view?: TenantBrandingView;
}

export async function updateTenantCustomDomain(domainInput: string): Promise<BrandingActionResult> {
  try {
    await requireAdmin();
    await dbConnect();
    const { tenantObjectId } = await getSessionTenant();

    const domain = normalizeHostname(domainInput);

    if (domain) {
      if (!isValidDomain(domain)) {
        return { success: false, error: "Enter a valid domain, e.g. mystore.com" };
      }
      const conflict = await Tenant.findOne({
        customDomain: domain,
        _id: { $ne: tenantObjectId },
      }).select({ _id: 1 }).lean();
      if (conflict) {
        return { success: false, error: "This domain is already in use by another account" };
      }
      await Tenant.updateOne({ _id: tenantObjectId }, { $set: { customDomain: domain } });
    } else {
      await Tenant.updateOne({ _id: tenantObjectId }, { $unset: { customDomain: '' } });
    }

    return { success: true, view: await getTenantBrandingSettings() };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.startsWith('Forbidden')) {
      return { success: false, error: msg };
    }
    console.error('[tenant-branding] update domain failed:', msg);
    return { success: false, error: 'Failed to save custom domain' };
  }
}

export async function uploadTenantSplash(formData: FormData): Promise<BrandingActionResult> {
  try {
    await requireAdmin();
    await dbConnect();
    const { tenantId, tenantObjectId } = await getSessionTenant();

    const file = formData.get('file');
    if (!(file instanceof File)) {
      return { success: false, error: 'No file provided' };
    }
    if (file.size === 0) {
      return { success: false, error: 'File is empty' };
    }
    if (file.size > MAX_INPUT_BYTES) {
      return { success: false, error: `File is too large (max ${MAX_INPUT_BYTES / (1024 * 1024)}MB)` };
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    let jpegBuffer: Buffer;
    try {
      jpegBuffer = await sharp(bytes)
        .resize(MAX_WIDTH, MAX_WIDTH, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 82 })
        .toBuffer();
    } catch (err) {
      return {
        success: false,
        error: 'Could not process image. Please upload a PNG, JPEG, WebP, or GIF.',
      };
    }

    await saveImage(jpegBuffer, splashFileName(tenantId));

    const version = Date.now().toString();
    await Tenant.updateOne({ _id: tenantObjectId }, { $set: { splashImage: version } });

    return { success: true, view: await getTenantBrandingSettings() };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.startsWith('Forbidden')) {
      return { success: false, error: msg };
    }
    console.error('[tenant-branding] splash upload failed:', msg);
    return { success: false, error: 'Failed to upload splash image' };
  }
}

export async function removeTenantSplash(): Promise<BrandingActionResult> {
  try {
    await requireAdmin();
    await dbConnect();
    const { tenantId, tenantObjectId } = await getSessionTenant();

    try {
      await deleteImage(splashFileName(tenantId));
    } catch (err) {
      // Treat missing file as already-removed.
      console.warn('[tenant-branding] delete splash from storage failed (continuing):', err instanceof Error ? err.message : String(err));
    }

    await Tenant.updateOne({ _id: tenantObjectId }, { $unset: { splashImage: '' } });

    return { success: true, view: await getTenantBrandingSettings() };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.startsWith('Forbidden')) {
      return { success: false, error: msg };
    }
    console.error('[tenant-branding] remove splash failed:', msg);
    return { success: false, error: 'Failed to remove splash image' };
  }
}
