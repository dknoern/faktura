"use client";

import { useState, useEffect, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import {
  getTenantRequiredDataSettings,
  updateTenantRequiredDataSettings,
  type RequiredDataSettingsView,
} from "@/lib/actions/tenant-required-data-actions";

export function RequiredDataSettingsSection() {
  const [settings, setSettings] = useState<RequiredDataSettingsView>({
    customerPhone: true,
    customerEmail: true,
    customerAddress: true,
    salesPerson: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getTenantRequiredDataSettings();
      setSettings(result);
    } catch {
      toast.error("Failed to load required field settings");
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
      const result = await updateTenantRequiredDataSettings(settings);
      if (!result.success) {
        toast.error(result.error || "Failed to save");
        return;
      }
      toast.success("Required field settings saved");
    } finally {
      setSaving(false);
    }
  }

  const toggle = (field: keyof RequiredDataSettingsView) =>
    setSettings((prev) => ({ ...prev, [field]: !prev[field] }));

  const fields: { key: keyof RequiredDataSettingsView; label: string; description: string }[] = [
    { key: "customerPhone", label: "Customer phone", description: "Require a phone number on customer records and invoices" },
    { key: "customerEmail", label: "Customer email", description: "Require an email address on customer records and invoices" },
    { key: "customerAddress", label: "Shipping address", description: "Require a shipping address on invoices" },
    { key: "salesPerson", label: "Sales person", description: "Require a sales person on invoices" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Required Fields</h2>
        <p className="text-sm text-muted-foreground">
          Control which fields are mandatory when creating customers and invoices.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-3">
          {fields.map(({ key, label, description }) => (
            <div key={key} className="flex items-start gap-3">
              <Checkbox
                id={`required-${key}`}
                checked={settings[key]}
                onCheckedChange={() => toggle(key)}
              />
              <div>
                <Label htmlFor={`required-${key}`} className="cursor-pointer font-medium">
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
