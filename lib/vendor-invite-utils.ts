import { createHash } from "crypto";

export const INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Invite tokens are stored hashed so a database leak can't be replayed
export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
