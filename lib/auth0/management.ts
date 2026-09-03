// Thin wrapper around the Auth0 Management API using the same Application
// credentials already used for the OIDC login flow (see auth.ts). Requires
// that Application to be authorized for the Management API (Dashboard ->
// Applications -> APIs -> Auth0 Management API) with create:users,
// update:users, read:users, create:user_tickets scopes.

interface ManagementTokenCache {
  token: string;
  expiresAt: number;
}

declare global {
  var auth0ManagementTokenCache: ManagementTokenCache | null;
}

let cached = global.auth0ManagementTokenCache;
if (!cached) {
  cached = global.auth0ManagementTokenCache = null;
}

function issuerBase(): string {
  const issuer = process.env.AUTH_AUTH0_ISSUER!;
  return issuer.endsWith("/") ? issuer : `${issuer}/`;
}

async function getManagementToken(): Promise<string> {
  const now = Date.now();
  if (cached && cached.expiresAt > now + 60_000) {
    return cached.token;
  }

  const res = await fetch(`${issuerBase()}oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: process.env.AUTH_AUTH0_ID,
      client_secret: process.env.AUTH_AUTH0_SECRET,
      audience: `${issuerBase()}api/v2/`,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to obtain Auth0 Management API token: ${res.status} ${body}`);
  }

  const data = await res.json();
  cached = global.auth0ManagementTokenCache = {
    token: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };
  return cached.token;
}

async function managementFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getManagementToken();
  return fetch(`${issuerBase()}api/v2/${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

export class Auth0ManagementError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function throwIfNotOk(res: Response): Promise<void> {
  if (res.ok) return;
  let message = `Auth0 Management API request failed with status ${res.status}`;
  try {
    const body = await res.json();
    message = body.message || body.error_description || message;
  } catch {
    // response wasn't JSON; keep the generic message
  }
  throw new Auth0ManagementError(res.status, message);
}

export interface NewAuth0User {
  email: string;
  password: string;
  tenantName: string;
  role: string;
}

export interface Auth0User {
  user_id: string;
  email: string;
  email_verified: boolean;
  app_metadata?: Record<string, unknown>;
}

export async function createAuth0User(data: NewAuth0User): Promise<Auth0User> {
  const res = await managementFetch("users", {
    method: "POST",
    body: JSON.stringify({
      connection: process.env.AUTH0_CONNECTION || "Username-Password-Authentication",
      email: data.email,
      password: data.password,
      email_verified: false,
      app_metadata: {
        tenantName: data.tenantName,
        role: data.role,
      },
    }),
  });
  await throwIfNotOk(res);
  return res.json();
}

export async function patchAuth0UserAppMetadata(
  userId: string,
  appMetadata: Record<string, unknown>
): Promise<void> {
  const res = await managementFetch(`users/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    body: JSON.stringify({ app_metadata: appMetadata }),
  });
  await throwIfNotOk(res);
}

export async function deleteAuth0User(userId: string): Promise<void> {
  const res = await managementFetch(`users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
  await throwIfNotOk(res);
}

export async function createEmailVerificationTicket(
  userId: string,
  resultUrl: string
): Promise<string> {
  const res = await managementFetch("tickets/email-verification", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, result_url: resultUrl }),
  });
  await throwIfNotOk(res);
  const data = await res.json();
  return data.ticket;
}

export async function findUserByEmail(email: string): Promise<Auth0User | null> {
  const res = await managementFetch(`users-by-email?email=${encodeURIComponent(email)}`);
  await throwIfNotOk(res);
  const users: Auth0User[] = await res.json();
  return users[0] || null;
}
