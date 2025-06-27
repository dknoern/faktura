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
        return Response.redirect(new URL('/products', nextUrl));
      }
      return true;

    },
    jwt({ token, trigger, session, account }) {
      if (trigger === "update") token.name = session.user.name
      if (account?.provider === "keycloak") {
        return { ...token, accessToken: account.access_token }
      }
      return token
    },
    async session({ session, token }) {
      if (token?.accessToken) session.accessToken = token.accessToken

      return session
    },
  },
  experimental: { enableWebAuthn: true },
})

declare module "next-auth" {
  interface Session {
    accessToken?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
  }
}
