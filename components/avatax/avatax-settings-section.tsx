"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";
import {
  getTenantAvataxSettings,
  updateTenantAvataxConfig,
  removeTenantAvataxCredentials,
  type AvataxSettingsView,
} from "@/lib/actions/tenant-avatax-actions";

export function AvataxSettingsSection() {
  const [settings, setSettings] = useState<AvataxSettingsView | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [environment, setEnvironment] = useState<"sandbox" | "production">("sandbox");
  const [companyCode, setCompanyCode] = useState("");

  const applySettings = useCallback((s: AvataxSettingsView) => {
    setSettings(s);
    setEnabled(s.enabled);
    setUsername(s.username || "");
    setEnvironment(s.environment === "production" ? "production" : "sandbox");
    setCompanyCode(s.companyCode || "");
    setPassword("");
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getTenantAvataxSettings();
      applySettings(result);
    } catch {
      toast.error("Failed to load AvaTax settings");
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
      const result = await updateTenantAvataxConfig({
        enabled,
        username: username.trim() || undefined,
        password: password.trim() || undefined,
        environment,
        companyCode: companyCode.trim() || undefined,
      });
      if (!result.success) {
        toast.error(result.error || "Failed to save");
        return;
      }
      toast.success("AvaTax settings saved");
      if (result.settings) applySettings(result.settings);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!confirm("Remove AvaTax credentials? Invoices saved while this is removed will have tax: 0.")) {
      return;
    }
    setRemoving(true);
    try {
      const result = await removeTenantAvataxCredentials();
      if (!result.success) {
        toast.error(result.error || "Failed to remove credentials");
        return;
      }
      toast.success("AvaTax credentials removed");
      if (result.settings) applySettings(result.settings);
    } finally {
      setRemoving(false);
    }
  }

  const passwordPlaceholder = settings?.hasPassword
    ? `••••${settings.passwordLast4 || "????"}`
    : "Your AvaTax password / license key";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">AvaTax</h2>
        <p className="text-sm text-muted-foreground">
          When enabled, invoices use AvaTax for sales-tax calculation. Disabled tenants save invoices with <code>tax: 0</code>.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="avatax-enabled"
              checked={enabled}
              onCheckedChange={(value) => setEnabled(value === true)}
            />
            <Label htmlFor="avatax-enabled" className="cursor-pointer">
              Calculate tax with AvaTax on new invoices
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatax-username">Username</Label>
            <Input
              id="avatax-username"
              autoComplete="off"
              placeholder="AvaTax username or account ID"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Your AvaTax login username, or numeric account ID if you use license-key auth.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatax-password">Password / License key</Label>
            <Input
              id="avatax-password"
              type="password"
              autoComplete="off"
              placeholder={passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {settings?.hasPassword
                ? "A password is stored. Leave blank to keep it, or paste a new value to replace it."
                : "AvaTax portal password, or license key if you use account-id auth."}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatax-env">Environment</Label>
            <Select value={environment} onValueChange={(v) => setEnvironment(v as "sandbox" | "production")}>
              <SelectTrigger id="avatax-env">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox</SelectItem>
                <SelectItem value="production">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatax-company">Company code <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input
              id="avatax-company"
              autoComplete="off"
              placeholder="DEFAULT"
              value={companyCode}
              onChange={(e) => setCompanyCode(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to use <code>DEFAULT</code> (matches the previous hardcoded behavior).
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            {settings?.hasPassword && (
              <Button variant="outline" onClick={handleRemove} disabled={removing}>
                {removing ? "Removing…" : "Remove credentials"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
