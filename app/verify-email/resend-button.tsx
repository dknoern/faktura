"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { resendVerificationEmail } from "@/lib/actions/signup-actions";

export function ResendButton({ email }: { email: string }) {
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setIsSending(true);
    setMessage(null);
    try {
      const result = await resendVerificationEmail(email);
      setMessage(
        result.success
          ? "Verification email sent. Please check your inbox."
          : result.error || "Failed to resend verification email"
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button className="w-full" onClick={handleClick} disabled={isSending}>
        {isSending ? "Sending..." : "Resend verification email"}
      </Button>
      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
