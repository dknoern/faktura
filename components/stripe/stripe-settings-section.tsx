"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "react-hot-toast";
import {
  getTenantStripeSettings,
  updateTenantStripeConfig,
  removeTenantStripeCredentials,
  type StripeSettingsView,
} from "@/lib/actions/tenant-stripe-actions";

export function StripeSettingsSection() {
  const [settings, setSettings] = useState<StripeSettingsView | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [secretKey, setSecretKey] = useState("");
  const [publishableKey, setPublishableKey] = useState("");

  const applySettings = useCallback((s: StripeSettingsView) => {
    setSettings(s);
    setEnabled(s.enabled);
    setPublishableKey(s.publishableKey || "");
    setSecretKey("");
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getTenantStripeSettings();
      applySettings(result);
    } catch {
      toast.error("Failed to load Stripe settings");
    } finally {
      setLoading(false);
    }
  }, [applySettings]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    setSaving(true);
    try {
      const result = await updateTenantStripeConfig({
        enabled,
        secretKey: secretKey.trim() || undefined,
        publishableKey: publishableKey.trim() || undefined,
      });
      if (!result.success) {
        toast.error(result.error || "Failed to save");
        return;
      }
      toast.success("Stripe settings saved");
      if (result.settings) applySettings(result.settings);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!confirm("Remove Stripe credentials? Existing payment links on past invoices will remain, but no new links will be created.")) {
      return;
    }
    setRemoving(true);
    try {
      const result = await removeTenantStripeCredentials();
      if (!result.success) {
        toast.error(result.error || "Failed to remove credentials");
        return;
      }
      toast.success("Stripe credentials removed");
      if (result.settings) applySettings(result.settings);
    } finally {
      setRemoving(false);
    }
  }

  const placeholder = settings?.hasSecretKey
    ? `sk_••••${settings.secretKeyLast4 || "????"}`
    : "sk_live_… or sk_test_…";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Stripe Payments</h2>
        <p className="text-sm text-muted-foreground">
          Add Stripe credentials to generate a payment link for each invoice. Customers can pay by credit card or ACH directly.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="stripe-enabled"
              checked={enabled}
              onCheckedChange={(value) => setEnabled(value === true)}
            />
            <Label htmlFor="stripe-enabled" className="cursor-pointer">
              Generate payment links for new invoices
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stripe-secret">Stripe secret key</Label>
            <Input
              id="stripe-secret"
              type="password"
              autoComplete="off"
              placeholder={placeholder}
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {settings?.hasSecretKey
                ? "A key is stored. Leave blank to keep it, or paste a new value to replace it."
                : "Use a restricted key with permission to create payment links."}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stripe-publishable">Publishable key (optional)</Label>
            <Input
              id="stripe-publishable"
              autoComplete="off"
              placeholder="pk_live_… or pk_test_…"
              value={publishableKey}
              onChange={(e) => setPublishableKey(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            {settings?.hasSecretKey && (
              <Button
                variant="outline"
                onClick={handleRemove}
                disabled={removing}
              >
                {removing ? "Removing…" : "Remove credentials"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
