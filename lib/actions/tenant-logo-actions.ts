'use server'

import sharp from "sharp";
import dbConnect from "@/lib/dbConnect";
import { Tenant } from "@/lib/models/tenant";
import { getTenantId } from "@/lib/auth-utils";
import { getTenantObjectId } from "@/lib/tenant-utils";
import { auth } from "@/auth";
import { saveImage, deleteImage } from "@/lib/utils/storage";

const MAX_INPUT_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSION = 1000; // px

async function requireAdmin(): Promise<void> {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== 'admin') {
    throw new Error('Forbidden: admin access required');
  }
}

function logoFileName(tenantId: string): string {
  return `logo-${tenantId}.png`;
}

function buildLogoUrl(tenantId: string, version: string | null | undefined): string {
  const v = version ? encodeURIComponent(version) : `${Date.now()}`;
  return `/api/images/${logoFileName(tenantId)}?v=${v}`;
}

export interface TenantLogoView {
  hasLogo: boolean;
  logoUrl: string | null;
}

export async function getTenantLogoInfo(): Promise<TenantLogoView> {
  await dbConnect();
  const tenantId = await getTenantId();
  const tenantObjectId = await getTenantObjectId();
  const tenant = await Tenant.findOne({ _id: tenantObjectId }).select('logo').lean();
  const version = (tenant as any)?.logo as string | undefined;
  if (!version) {
    return { hasLogo: false, logoUrl: null };
  }
  return { hasLogo: true, logoUrl: buildLogoUrl(tenantId, version) };
}

export interface UploadLogoResult {
  success: boolean;
  error?: string;
  view?: TenantLogoView;
}

export async function uploadTenantLogo(formData: FormData): Promise<UploadLogoResult> {
  try {
    await requireAdmin();
    await dbConnect();
    const tenantId = await getTenantId();

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

    let pngBuffer: Buffer;
    try {
      pngBuffer = await sharp(bytes)
        .resize(MAX_DIMENSION, MAX_DIMENSION, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .png()
        .toBuffer();
    } catch (err) {
      return {
        success: false,
        error: 'Could not process image. Please upload a PNG, JPEG, WebP, or GIF.',
      };
    }

    await saveImage(pngBuffer, logoFileName(tenantId));

    const version = Date.now().toString();
    const tenantObjectId = await getTenantObjectId();
    await Tenant.updateOne({ _id: tenantObjectId }, { $set: { logo: version } });

    return {
      success: true,
      view: { hasLogo: true, logoUrl: buildLogoUrl(tenantId, version) },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.startsWith('Forbidden')) {
      return { success: false, error: msg };
    }
    console.error('[tenant-logo] upload failed:', msg);
    return { success: false, error: 'Failed to upload logo' };
  }
}

export async function removeTenantLogo(): Promise<UploadLogoResult> {
  try {
    await requireAdmin();
    await dbConnect();
    const tenantId = await getTenantId();

    try {
      await deleteImage(logoFileName(tenantId));
    } catch (err) {
      // Treat missing file as already-removed.
      console.warn('[tenant-logo] delete from storage failed (continuing):', err instanceof Error ? err.message : String(err));
    }

    const tenantObjectId = await getTenantObjectId();
    await Tenant.updateOne({ _id: tenantObjectId }, { $unset: { logo: '' } });

    return {
      success: true,
      view: { hasLogo: false, logoUrl: null },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.startsWith('Forbidden')) {
      return { success: false, error: msg };
    }
    console.error('[tenant-logo] remove failed:', msg);
    return { success: false, error: 'Failed to remove logo' };
  }
}
