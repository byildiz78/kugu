import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Check if request has valid Bearer token
 */
function hasBearerToken(req: any): boolean {
  const authHeader = req.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false
  }
  
  const token = authHeader.substring(7)
  const expectedToken = process.env.API_BEARER_TOKEN
  
  return Boolean(expectedToken && token === expectedToken)
}

// Simple middleware for mobile routes
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

// Use withAuth for admin routes
const adminMiddleware = withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Admin routes require ADMIN or RESTAURANT_ADMIN role
        if (pathname.startsWith('/admin')) {
          return token?.role === 'ADMIN' || token?.role === 'RESTAURANT_ADMIN'
        }
        
        // API routes (excluding mobile) require authentication
        if (pathname.startsWith('/api') && !pathname.startsWith('/api/mobile/')) {
          // Check Bearer token first
          if (hasBearerToken(req)) {
            return true
          }
          // Fallback to session check
          return !!token
        }
        
        return true
      }
    }
  }
)

// Export the appropriate middleware based on path
export default function combinedMiddleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  // Skip middleware for NextAuth routes - they handle their own auth
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }
  
  // Use withAuth middleware for admin and API routes
  if (pathname.startsWith('/admin') || (pathname.startsWith('/api') && !pathname.startsWith('/api/mobile/'))) {
    return (adminMiddleware as any)(req)
  }
  
  // Use simple middleware for mobile routes
  return middleware(req)
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*', '/mobile/:path*']
}