"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import {
  getTenantLogoInfo,
  uploadTenantLogo,
  removeTenantLogo,
  type TenantLogoView,
} from "@/lib/actions/tenant-logo-actions";

export function TenantLogoSection() {
  const [view, setView] = useState<TenantLogoView | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getTenantLogoInfo();
      setView(result);
    } catch {
      toast.error("Failed to load logo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-uploading the same file later
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadTenantLogo(formData);
      if (!result.success) {
        toast.error(result.error || "Upload failed");
        return;
      }
      toast.success("Logo uploaded");
      if (result.view) setView(result.view);
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    if (!confirm("Remove the tenant logo?")) return;
    setRemoving(true);
    try {
      const result = await removeTenantLogo();
      if (!result.success) {
        toast.error(result.error || "Remove failed");
        return;
      }
      toast.success("Logo removed");
      if (result.view) setView(result.view);
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Logo</h2>
        <p className="text-sm text-muted-foreground">
          Appears on invoices, repairs, and other documents. PNG, JPEG, WebP, or GIF up to 5MB.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-3">
          <div className="flex h-32 w-fit min-w-32 items-center justify-center rounded border bg-muted/30 p-3">
            {view?.hasLogo && view.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={view.logoUrl}
                alt="Tenant logo"
                className="max-h-24 max-w-[280px] object-contain"
              />
            ) : (
              <span className="text-sm text-muted-foreground">No logo uploaded</span>
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
            <Button onClick={openFilePicker} disabled={uploading || removing}>
              {uploading ? "Uploading…" : view?.hasLogo ? "Replace logo" : "Upload logo"}
            </Button>
            {view?.hasLogo && (
              <Button variant="outline" onClick={handleRemove} disabled={uploading || removing}>
                {removing ? "Removing…" : "Remove logo"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
