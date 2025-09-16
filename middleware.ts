import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Mobile routes - check for auth cookie
  if (pathname.startsWith('/mobile') && !pathname.startsWith('/mobile/auth/')) {
    const authToken = request.cookies.get('mobile-auth-token')
    if (!authToken) {
      const url = new URL('/mobile/auth/phone', request.url)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

// Only apply middleware to mobile routes
// Let NextAuth handle its own routes without any middleware interference
export const config = {
  matcher: '/mobile/:path*'
}