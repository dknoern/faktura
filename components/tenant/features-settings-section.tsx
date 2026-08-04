"use client";

import { useState, useEffect, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import {
  getTenantFeaturesSettings,
  updateTenantFeaturesSettings,
  type TenantFeaturesView,
} from "@/lib/actions/tenant-features-actions";

const FEATURE_FIELDS: { key: keyof TenantFeaturesView; label: string; description: string }[] = [
  { key: "proposals", label: "Proposals", description: "Enable proposal creation and management" },
  { key: "returns", label: "Returns", description: "Enable return merchandise authorizations" },
  { key: "repairs", label: "Repairs", description: "Enable repair service orders" },
  { key: "wanted", label: "Wanted", description: "Enable wanted-item tracking for customers" },
  { key: "loginitems", label: "Log In Items", description: "Enable item check-in for shows" },
  { key: "logoutitems", label: "Log Out Items", description: "Enable item check-out for shows" },
  { key: "reports", label: "Reports", description: "Enable the reports section" },
  { key: "payments", label: "Payments", description: "Enable payment tracking on invoices" },
];

export function FeaturesSettingsSection() {
  const [settings, setSettings] = useState<TenantFeaturesView>({
    proposals: false,
    returns: false,
    repairs: false,
    wanted: false,
    loginitems: false,
    logoutitems: false,
    reports: false,
    payments: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getTenantFeaturesSettings();
      setSettings(result);
    } catch {
      toast.error("Failed to load feature settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    setSaving(true);
    try {
      const result = await updateTenantFeaturesSettings(settings);
      if (!result.success) {
        toast.error(result.error ?? "Failed to save");
        return;
      }
      toast.success("Feature settings saved");
    } finally {
      setSaving(false);
    }
  }

  const toggle = (field: keyof TenantFeaturesView) =>
    setSettings((prev) => ({ ...prev, [field]: !prev[field] }));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Features</h2>
        <p className="text-sm text-muted-foreground">
          Enable or disable optional features for your account.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-3">
          {FEATURE_FIELDS.map(({ key, label, description }) => (
            <div key={key} className="flex items-start gap-3">
              <Checkbox
                id={`feature-${key}`}
                checked={settings[key]}
                onCheckedChange={() => toggle(key)}
              />
              <div>
                <Label htmlFor={`feature-${key}`} className="cursor-pointer font-medium">
                  {label}
                </Label>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}

          <Button onClick={handleSave} disabled={saving} className="mt-2">
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      )}
    </div>
  );
}
