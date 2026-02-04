import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "./auth"

// Read more: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
}

export default auth((req: NextRequest & { auth: any }) => {
  const session = req.auth
  const { pathname } = req.nextUrl
  
  // Skip middleware for server actions to avoid clientReferenceManifest issues
  if (req.method === 'POST' && req.headers.get('content-type')?.includes('multipart/form-data')) {
    return NextResponse.next()
  }
  
  // Handle redirect from root to home for authenticated users
  if (session?.user && pathname === '/') {
    return NextResponse.redirect(new URL('/home', req.url))
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
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
})