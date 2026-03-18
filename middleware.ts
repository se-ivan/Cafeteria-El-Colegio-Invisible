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
    return NextResponse.next()
  }

  // Protected routes - require authentication
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon).*)"]
}
