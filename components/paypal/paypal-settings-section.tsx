"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";
import {
  getTenantPaypalSettings,
  updateTenantPaypalConfig,
  removeTenantPaypalCredentials,
  type PaypalSettingsView,
} from "@/lib/actions/tenant-paypal-actions";

export function PaypalSettingsSection() {
  const [settings, setSettings] = useState<PaypalSettingsView | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [environment, setEnvironment] = useState<'sandbox' | 'live'>('sandbox');
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");

  const applySettings = useCallback((s: PaypalSettingsView) => {
    setSettings(s);
    setEnabled(s.enabled);
    setEnvironment(s.environment);
    setClientId(s.clientId || "");
    setClientSecret("");
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getTenantPaypalSettings();
      applySettings(result);
    } catch {
      toast.error("Failed to load PayPal settings");
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
      const result = await updateTenantPaypalConfig({
        enabled,
        environment,
        clientId: clientId.trim() || undefined,
        clientSecret: clientSecret.trim() || undefined,
      });
      if (!result.success) {
        toast.error(result.error || "Failed to save");
        return;
      }
      toast.success("PayPal settings saved");
      if (result.settings) applySettings(result.settings);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!confirm("Remove PayPal credentials? Venmo payouts will be disabled until new credentials are added.")) {
      return;
    }
    setRemoving(true);
    try {
      const result = await removeTenantPaypalCredentials();
      if (!result.success) {
        toast.error(result.error || "Failed to remove credentials");
        return;
      }
      toast.success("PayPal credentials removed");
      if (result.settings) applySettings(result.settings);
    } finally {
      setRemoving(false);
    }
  }

  const secretPlaceholder = settings?.hasClientSecret
    ? `••••${settings.clientSecretLast4 || "????"}`
    : "Client secret";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">PayPal Payments</h2>
        <p className="text-sm text-muted-foreground">
          Add PayPal API credentials to send Venmo payouts to vendors. Venmo payouts are disabled
          until a Client ID and Client Secret are saved here.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="paypal-enabled"
              checked={enabled}
              onCheckedChange={(value) => setEnabled(value === true)}
            />
            <Label htmlFor="paypal-enabled" className="cursor-pointer">
              Enable Venmo payouts to vendors
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paypal-environment">Environment</Label>
            <Select value={environment} onValueChange={(v) => setEnvironment(v as 'sandbox' | 'live')}>
              <SelectTrigger id="paypal-environment" className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox (testing)</SelectItem>
                <SelectItem value="live">Live</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paypal-client-id">Client ID</Label>
            <Input
              id="paypal-client-id"
              autoComplete="off"
              placeholder="PayPal app Client ID"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paypal-client-secret">Client secret</Label>
            <Input
              id="paypal-client-secret"
              type="password"
              autoComplete="off"
              placeholder={secretPlaceholder}
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {settings?.hasClientSecret
                ? "A secret is stored. Leave blank to keep it, or paste a new value to replace it."
                : "From your PayPal app's credentials page (developer.paypal.com)."}
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            {settings?.hasClientSecret && (
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
