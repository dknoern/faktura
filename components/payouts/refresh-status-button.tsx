"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { refreshVendorPayoutStatus } from "@/lib/actions/vendor-payment-actions";

export function RefreshStatusButton({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const result = await refreshVendorPayoutStatus(paymentId);
      if (!result.success) {
        toast.error(result.error || "Failed to check status");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={loading}>
      <RefreshCw className={`mr-2 h-3 w-3 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Checking..." : "Refresh status"}
    </Button>
  );
}
