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
    // Try to get fullName from custom claim first, then fallback to user.name
    let fullName = (session as any).fullName;
    if (!fullName && session.user?.name) {
      // If no custom fullName claim, use the user's name as fallback
      fullName = session.user.name;
    }
    
    if (fullName) {
      requestHeaders.set('x-full-name', fullName)
    }
  }
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
})