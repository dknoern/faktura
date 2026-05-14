"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { revokeApiKey } from "@/lib/actions/api-key-actions";
import { toast } from "react-hot-toast";
import { Trash2 } from "lucide-react";

interface ApiKeyRow {
  id: string;
  label: string;
  createdBy: string | null;
  createdAt: Date;
  lastUsedAt: Date | null;
}

interface ApiKeysTableProps {
  keys: ApiKeyRow[];
  onRevoked: () => void;
}

export function ApiKeysTable({ keys, onRevoked }: ApiKeysTableProps) {
  const [pendingRevoke, setPendingRevoke] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

  async function handleRevoke() {
    if (!pendingRevoke) return;
    setRevoking(true);
    try {
      await revokeApiKey(pendingRevoke);
      toast.success("API key revoked");
      onRevoked();
    } catch {
      toast.error("Failed to revoke API key");
    } finally {
      setRevoking(false);
      setPendingRevoke(null);
    }
  }

  if (keys.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No API keys yet. Create one to get started.
      </p>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Label</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last Used</TableHead>
            <TableHead className="w-16"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keys.map((key) => (
            <TableRow key={key.id}>
              <TableCell className="font-medium">{key.label}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {key.createdBy ?? "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(key.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : "Never"}
              </TableCell>
              <TableCell>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setPendingRevoke(key.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!pendingRevoke} onOpenChange={(o) => !o && setPendingRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This key will be immediately invalidated. Any integrations using it will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              disabled={revoking}
              className="bg-destructive hover:bg-destructive/90"
            >
              {revoking ? "Revoking…" : "Revoke"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
