"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { signOutAction } from "@/lib/actions/auth-actions";

export function SignOutButton(props: React.ComponentPropsWithRef<typeof Button>) {
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOutAction();
    } finally {
      // Full-page navigation: guarantees the landing page is a fresh GET on
      // the current host, so tenant custom domains keep their branded page
      window.location.assign("/");
    }
  }

  return (
    <Button
      variant="ghost"
      className="w-full p-0"
      onClick={handleSignOut}
      disabled={signingOut}
      {...props}
    >
      {signingOut ? "Signing Out…" : "Sign Out"}
    </Button>
  );
}
