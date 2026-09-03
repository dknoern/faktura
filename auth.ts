import NextAuth from "next-auth"
import "next-auth/jwt"

import Auth0 from "next-auth/providers/auth0"

// Routes reachable without a session. Everything else defaults to protected,
// so new routes are locked down unless explicitly opened up here.
const PUBLIC_ROUTES = [
  '/',              // marketing / login landing page
  '/public',        // public tenant landing page
  '/auth',          // NextAuth sign-in/callback pages (basePath: /auth)
  '/signup',        // account signup flow
  '/verify-email',  // email verification flow
  '/esign',         // customer-facing e-sign pages
  '/api/esign',     // e-sign API used by the pages above
  '/api/webhooks',  // signature-verified webhooks (e.g. Stripe)
  '/api/trello',    // signature-verified Trello webhook
  '/api/v1',        // versioned API, authenticated via per-tenant API keys instead of session
  '/api/images',    // serves image bytes referenced by outbound emails/esign pages
  '/icon',          // app icon
]

function isPublicPath(pathname: string) {
  return PUBLIC_ROUTES.some((route) =>
    route === '/' ? pathname === '/' : pathname === route || pathname.startsWith(`${route}/`)
  )
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: !!process.env.AUTH_DEBUG,
  theme: { logo: "https://authjs.dev/img/logo-sm.png" },
  providers: [
    Auth0({
      clientId: process.env.AUTH_AUTH0_ID!,
      clientSecret: process.env.AUTH_AUTH0_SECRET!,
      issuer: process.env.AUTH_AUTH0_ISSUER!,
    }),
  ],
  basePath: "/auth",
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {

      const isLoggedIn = !!auth?.user;

      if (isPublicPath(nextUrl.pathname)) {
        if (isLoggedIn && nextUrl.pathname === '/') {
          return Response.redirect(new URL('/home', nextUrl));
        }
        return true;
      }

      if (isLoggedIn) return true;
      return Response.redirect(new URL('/', nextUrl));
    },
    jwt({ token, trigger, session, account, profile }) {
      if (trigger === "update") token.name = session.user.name
      
      // Store the access token from Auth0 or other providers
      if (account?.access_token) {
        token.accessToken = account.access_token
      }
      
      // Pass through Auth0 custom claims from the profile
      if (profile) {
        // Auth0 custom claims are typically namespaced
        const profileAny = profile as any

        const tenantName = profileAny['https://fakturian.com/tenantName'] || profileAny.tenantName
        if (tenantName && typeof tenantName === 'string') {
          token.tenantName = tenantName
        }

        const tenantId = profileAny['https://fakturian.com/tenantId'] || profileAny.tenantId
        if (tenantId && typeof tenantId === 'string') {
          token.tenantId = tenantId
        }

        const fullName = profileAny['https://fakturian.com/fullName'] || profileAny.fullName
        if (fullName && typeof fullName === 'string') {
          token.fullName = fullName
        }

        const role = profileAny['https://fakturian.com/role'] || profileAny.role
        if (role && typeof role === 'string') {
          token.role = role
        }

        // Standard OIDC claim, unnamespaced
        if (typeof profileAny.email_verified === 'boolean') {
          token.emailVerified = profileAny.email_verified
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token?.accessToken) session.accessToken = token.accessToken
      
      // Pass tenantId to the session
      if (token?.tenantId) {
        (session as any).tenantId = token.tenantId
        // Also add it to the user object for easier access
        if (session.user) {
          (session.user as any).tenantId = token.tenantId
        }
      }

      // Pass tenantName to the session
      if (token?.tenantName) {
        (session as any).tenantName = token.tenantName
        // Also add it to the user object for easier access
        if (session.user) {
          (session.user as any).tenantName = token.tenantName
        }
      }

      // Pass tenantId to the session
      if (token?.tenantId) {
        (session as any).tenantId = token.tenantId
        // Also add it to the user object for easier access
        if (session.user) {
          (session.user as any).tenantId = token.tenantId
        }
      }

      // Pass fullName to the session
      if (token?.fullName) {
        (session as any).fullName = token.fullName
        // Also add it to the user object for easier access
        if (session.user) {
          (session.user as any).fullName = token.fullName
        }
      }

      // Pass role to the session
      if (token?.role) {
        if (session.user) {
          (session.user as any).role = token.role
        }
      }

      // Pass emailVerified to the session
      if (typeof token?.emailVerified === 'boolean') {
        if (session.user) {
          (session.user as any).emailVerified = token.emailVerified
        }
      }

      return session
    },
  },
  experimental: { enableWebAuthn: true },
})

declare module "next-auth" {
  interface Session {
    accessToken?: string
    tenantId?: string
    tenantName?: string
    fullName?: string
  }
  interface User {
    tenantId?: string
    tenantName?: string
    fullName?: string
    role?: string
    emailVerified?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    tenantId?: string
    fullName?: string
    tenantName?: string
    role?: string
    emailVerified?: boolean
  }
}
