import { NextResponse } from "next/server"
import { auth } from "./auth"

// Or like this if you need to do something here.
// export default auth((req) => {
//   console.log(req.auth) //  { session: { user: { ... } } }
// })

// Read more: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

export default auth((req) => {
  const session = req.auth
  const { pathname } = req.nextUrl
  
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

  // Check for kiosk mode from cookie
  const isKioskMode = req.cookies.get('kiosk-mode')?.value === 'true'
  
  // If in kiosk mode, restrict access to dashboard pages
  if (isKioskMode && pathname.startsWith('/') && !pathname.startsWith('/kiosk') && !pathname.startsWith('/api') && pathname !== '/') {
    // Redirect to kiosk home if trying to access dashboard pages
    return NextResponse.redirect(new URL('/kiosk', req.url))
  }
  
  // If not in kiosk mode but trying to access kiosk pages, redirect to dashboard
  if (!isKioskMode && pathname.startsWith('/kiosk')) {
    return NextResponse.redirect(new URL('/home', req.url))
  }
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
})