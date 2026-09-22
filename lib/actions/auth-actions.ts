'use server'

import { signOut } from "@/auth";

// Clears the session without letting Auth.js pick the redirect target.
// The client performs a full-page navigation to '/' afterwards so the
// landing page renders from a plain GET on whatever host the user is on
// (tenant custom domains get their branded page).
export async function signOutAction(): Promise<void> {
  await signOut({ redirect: false });
}
