"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createApiKey } from "@/lib/actions/api-key-actions";
import { toast } from "react-hot-toast";
import { Copy, Check } from "lucide-react";

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateApiKeyDialog({ open, onOpenChange, onCreated }: CreateApiKeyDialogProps) {
  const [label, setLabel] = useState("");
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleClose() {
    setLabel("");
    setRawKey(null);
    setCopied(false);
    onOpenChange(false);
    if (rawKey) onCreated();
  }

  async function handleCreate() {
    if (!label.trim()) return;
    setLoading(true);
    try {
      const result = await createApiKey(label);
      setRawKey(result.raw);
    } catch {
      toast.error("Failed to create API key");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!rawKey) return;
    await navigator.clipboard.writeText(rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{rawKey ? "API Key Created" : "Create API Key"}</DialogTitle>
        </DialogHeader>

        {rawKey ? (
          <div className="space-y-4">
            <p className="text-sm text-amber-600 font-medium">
              Copy this key now. It will not be shown again.
            </p>
            <div className="flex items-center gap-2">
              <Input value={rawKey} readOnly className="font-mono text-xs" />
              <Button size="icon" variant="outline" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                placeholder="e.g. My Integration"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleCreate} disabled={loading || !label.trim()}>
                {loading ? "Creating…" : "Create Key"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
