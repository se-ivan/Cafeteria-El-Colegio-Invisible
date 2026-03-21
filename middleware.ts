import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get the session token from cookies
  const sessionToken = request.cookies.get("authjs.session-token")?.value ||
                       request.cookies.get("__Secure-authjs.session-token")?.value
  
  const isAuthenticated = !!sessionToken

  // Public routes - allow access
  if (pathname === "/login" || pathname.startsWith("/api/auth") || pathname.startsWith("/api/")) {
    const response = NextResponse.next()
    response.headers.set("X-Robots-Tag", "noindex, nofollow")
    return response
  }

  // Protected routes - require authentication
  if (!isAuthenticated) {
    const redirectResponse = NextResponse.redirect(new URL("/login", request.url))
    redirectResponse.headers.set("X-Robots-Tag", "noindex, nofollow")
    return redirectResponse
  }

  const response = NextResponse.next()
  response.headers.set("X-Robots-Tag", "noindex, nofollow")
  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon).*)"]
}
