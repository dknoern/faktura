// Mints a NextAuth v5 (@auth/core) JWE session cookie for the local dev server.
//
// Why this exists: auth.ts's `authorized()` callback 302-redirects every
// /proposals, /products, /customers, /invoices, ... request to `/` unless a
// session exists, and the only real login path is interactive Auth0. For local
// verification we sign our own token with the project's AUTH_SECRET.
//
// Run directly to print a token:  node .claude/skills/run-faktura/session.mjs
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const require = createRequire(import.meta.url)
const SKILL_DIR = path.dirname(fileURLToPath(import.meta.url))
export const PROJECT_DIR = path.resolve(SKILL_DIR, '../../..')

// The cookie name doubles as the JWE salt in @auth/core >= 0.30. Dev is plain
// http, so it's the unprefixed name — NOT __Secure-authjs.session-token.
export const COOKIE_NAME = 'authjs.session-token'

// Must match the `defaultTenantId` fallback in lib/auth-utils.ts, otherwise
// server actions and seeded data disagree about which tenant you are.
export const TENANT_ID = '67f48a2050abe41246b22a87'

export function loadEnv() {
  const raw = readFileSync(path.join(PROJECT_DIR, '.env'), 'utf8')
  return Object.fromEntries(
    raw
      .split('\n')
      .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
      .map((l) => {
        const i = l.indexOf('=')
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
      })
  )
}

export async function mintSessionToken({ maxAge = 60 * 60 } = {}) {
  const env = loadEnv()
  if (!env.AUTH_SECRET) throw new Error('AUTH_SECRET missing from .env')

  // Resolved from the project's own node_modules — next-auth pulls @auth/core in.
  const { encode } = await import(
    require.resolve('@auth/core/jwt', { paths: [PROJECT_DIR] })
  )

  return encode({
    salt: COOKIE_NAME,
    secret: env.AUTH_SECRET,
    maxAge,
    token: {
      sub: 'local-verify|1',
      name: 'Local Verify',
      email: 'local@verify.test',
      tenantId: TENANT_ID,
      tenantName: 'lager',
      fullName: 'Local Verify',
      role: 'admin',
    },
  })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(await mintSessionToken())
}
