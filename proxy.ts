import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "./auth"

// Read more: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)"],
}

export default auth((req: NextRequest & { auth: any }) => {
  const session = req.auth
  const { pathname } = req.nextUrl

  // Landing-page branding and signup gating are data-driven per host: the
  // '/' page looks up the tenant by custom domain (app/page.tsx), and the
  // signup page redirects away on tenant-branded domains (app/signup/page.tsx).


  // Skip middleware for server actions to avoid clientReferenceManifest issues
  if (req.method === 'POST' && req.headers.get('content-type')?.includes('multipart/form-data')) {
    return NextResponse.next()
  }
  
  // Handle redirect from root to home for authenticated users
  if (session?.user && pathname === '/') {
    return NextResponse.redirect(new URL('/home', req.url))
  }

  // Block unverified users from the dashboard until they confirm their email
  const isExemptFromVerification = pathname.startsWith('/verify-email') ||
                                    pathname.startsWith('/signup') ||
                                    pathname.startsWith('/auth')
  if (session?.user && (session.user as any).emailVerified === false && !isExemptFromVerification) {
    return NextResponse.redirect(new URL('/verify-email', req.url))
  }

  // Vendor users only get their (currently blank) home page until the vendor
  // portal ships; bounce them off every other route.
  const isVendorUser = (session?.user as any)?.role === 'vendor' || (session?.user as any)?.userType === 'vendor'
  if (session?.user && isVendorUser) {
    const isVendorAllowedPath = pathname === '/' ||
                                pathname === '/home' ||
                                pathname.startsWith('/time') ||
                                pathname.startsWith('/api/time') ||
                                pathname.startsWith('/auth') ||
                                pathname.startsWith('/verify-email') ||
                                pathname.startsWith('/invite') ||
                                // Public customer-facing e-sign pages still work while signed in
                                pathname.startsWith('/esign') ||
                                pathname.startsWith('/api/esign')
    if (!isVendorAllowedPath) {
      return NextResponse.redirect(new URL('/home', req.url))
    }
  }

  // Check payload size for server actions before processing
  const contentLength = req.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Request payload too large. Maximum size is 10MB.' 
    }), { 
      status: 413,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  // Clone the request headers
  const requestHeaders = new Headers(req.headers)

  if (session?.user) {
    // Add user data to headers for server actions to access
    requestHeaders.set('x-user-id', session.user.id || '')
    requestHeaders.set('x-user-email', session.user.email || '')
    requestHeaders.set('x-user-name', session.user.name || '')

    const shortUser = session.user.email?.split('@')[0] || 'System'
    requestHeaders.set('x-user-short', shortUser)

    if ((session as any).tenantId) {
      requestHeaders.set('x-tenant-id', (session as any).tenantId)
    }
    if ((session as any).tenantName) {
      requestHeaders.set('x-tenant-name', (session as any).tenantName)
    }
    if((session as any).fullName) {
      requestHeaders.set('x-full-name', (session as any).fullName)
    }
    if ((session.user as any).role) {
      requestHeaders.set('x-user-role', (session.user as any).role)
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
})