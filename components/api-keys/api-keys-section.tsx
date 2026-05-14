"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ApiKeysTable } from "./api-keys-table";
import { CreateApiKeyDialog } from "./create-api-key-dialog";
import { listApiKeys } from "@/lib/actions/api-key-actions";
import { Plus } from "lucide-react";

interface ApiKeyRow {
  id: string;
  label: string;
  createdBy: string | null;
  createdAt: Date;
  lastUsedAt: Date | null;
}

export function ApiKeysSection() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadKeys = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listApiKeys();
      setKeys(result);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">API Keys</h2>
          <p className="text-sm text-muted-foreground">
            Use API keys to access your data programmatically via the REST API.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Key
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <ApiKeysTable keys={keys} onRevoked={loadKeys} />
      )}

      <CreateApiKeyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={loadKeys}
      />
    </div>
  );
}
