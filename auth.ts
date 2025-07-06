import NextAuth from "next-auth"
import "next-auth/jwt"

import Auth0 from "next-auth/providers/auth0"

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: !!process.env.AUTH_DEBUG,
  theme: { logo: "https://authjs.dev/img/logo-sm.png" },
  providers: [
    Auth0,
  ],
  basePath: "/auth",
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {

      const isLoggedIn = !!auth?.user;
      const isOnProtectedRoute = nextUrl.pathname.startsWith('/products') || 
                                 nextUrl.pathname.startsWith('/customers') ||
                                 nextUrl.pathname.startsWith('/invoices') ||
                                 nextUrl.pathname.startsWith('/returns') ||
                                 nextUrl.pathname.startsWith('/repairs') ||
                                 nextUrl.pathname.startsWith('/loginitems') ||
                                 nextUrl.pathname.startsWith('/logoutitems') ||
                                 nextUrl.pathname.startsWith('/reports') ||
                                 nextUrl.pathname.startsWith('/profile') ||
                                 nextUrl.pathname.startsWith('/proposals');
      if (isOnProtectedRoute) {
        if (isLoggedIn) return true;
        return Response.redirect(new URL('/', nextUrl));
      } else if (isLoggedIn && nextUrl.pathname === '/') {
        return Response.redirect(new URL('/home', nextUrl));
      }
      return true;

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
        const tenantId = profileAny['https://fakturian.com/tenantId'] || profileAny.tenantId
        if (tenantId && typeof tenantId === 'string') {
          token.tenantId = tenantId
        }
        
        // Store the full profile for debugging
        if (process.env.NODE_ENV === 'development') {
          console.log('Auth0 profile:', JSON.stringify(profile, null, 2))
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

      return session
    },
  },
  experimental: { enableWebAuthn: true },
})

declare module "next-auth" {
  interface Session {
    accessToken?: string
    tenantId?: string
  }
  interface User {
    tenantId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    tenantId?: string
  }
}
