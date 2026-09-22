"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import {
  getTenantBrandingSettings,
  updateTenantCustomDomain,
  uploadTenantSplash,
  removeTenantSplash,
  type TenantBrandingView,
} from "@/lib/actions/tenant-branding-actions";

export function BrandingSettingsSection() {
  const [view, setView] = useState<TenantBrandingView | null>(null);
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingDomain, setSavingDomain] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getTenantBrandingSettings();
      setView(result);
      setDomain(result.customDomain);
    } catch {
      toast.error("Failed to load branding settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSaveDomain() {
    setSavingDomain(true);
    try {
      const result = await updateTenantCustomDomain(domain);
      if (!result.success) {
        toast.error(result.error ?? "Failed to save domain");
        return;
      }
      toast.success(result.view?.customDomain ? "Custom domain saved" : "Custom domain removed");
      if (result.view) {
        setView(result.view);
        setDomain(result.view.customDomain);
      }
    } finally {
      setSavingDomain(false);
    }
  }

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadTenantSplash(formData);
      if (!result.success) {
        toast.error(result.error || "Upload failed");
        return;
      }
      toast.success("Splash image uploaded");
      if (result.view) setView(result.view);
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveSplash() {
    if (!confirm("Remove the splash background image?")) return;
    setRemoving(true);
    try {
      const result = await removeTenantSplash();
      if (!result.success) {
        toast.error(result.error || "Remove failed");
        return;
      }
      toast.success("Splash image removed");
      if (result.view) setView(result.view);
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Custom Domain &amp; Splash</h2>
        <p className="text-sm text-muted-foreground">
          When visitors arrive at your custom domain (including www or any subdomain), they see a
          branded welcome page with your splash background and no self-signup.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-5">
          <div className="max-w-md space-y-1.5">
            <Label htmlFor="custom-domain">Custom domain</Label>
            <div className="flex gap-2">
              <Input
                id="custom-domain"
                placeholder="e.g. mystore.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
              <Button onClick={handleSaveDomain} disabled={savingDomain}>
                {savingDomain ? "Saving…" : "Save"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave blank and save to remove the custom domain (visitors will see the generic
              landing page with signup again).
            </p>
          </div>

          <div className="space-y-3">
            <Label>Splash background image</Label>
            <div className="flex h-40 w-full max-w-md items-center justify-center overflow-hidden rounded border bg-muted/30">
              {view?.hasSplash && view.splashUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={view.splashUrl}
                  alt="Splash background"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm text-muted-foreground">No splash image uploaded</span>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleFileSelected}
            />

            <div className="flex gap-2">
              <Button onClick={() => fileInputRef.current?.click()} disabled={uploading || removing}>
                {uploading ? "Uploading…" : view?.hasSplash ? "Replace splash" : "Upload splash"}
              </Button>
              {view?.hasSplash && (
                <Button variant="outline" onClick={handleRemoveSplash} disabled={uploading || removing}>
                  {removing ? "Removing…" : "Remove splash"}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              PNG, JPEG, WebP, or GIF up to 10MB. Shown full-screen behind the welcome page, so a
              wide, high-resolution photo works best.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
