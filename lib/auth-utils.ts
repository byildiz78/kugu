import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * API Authentication utility functions
 */

/**
 * Check if request has valid Bearer token
 */
export function checkBearerToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false
  }
  
  const token = authHeader.substring(7) // Remove 'Bearer ' prefix
  const expectedToken = process.env.API_BEARER_TOKEN
  
  if (!expectedToken) {
    console.warn('API_BEARER_TOKEN not configured in environment')
    return false
  }
  
  return token === expectedToken
}

/**
 * Check if user has valid session
 */
export async function checkSession(): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions)
    return !!session
  } catch (error) {
    console.error('Session check failed:', error)
    return false
  }
}

/**
 * Unified authentication check for API routes
 * Accepts either valid session OR valid bearer token
 */
export async function authenticateRequest(request: NextRequest): Promise<{
  isAuthenticated: boolean
  authMethod: 'session' | 'bearer' | 'none'
  error?: string
}> {
  // Check Bearer token first (faster)
  if (checkBearerToken(request)) {
    return {
      isAuthenticated: true,
      authMethod: 'bearer'
    }
  }
  
  // Check session as fallback
  const hasValidSession = await checkSession()
  if (hasValidSession) {
    return {
      isAuthenticated: true,
      authMethod: 'session'
    }
  }
  
  return {
    isAuthenticated: false,
    authMethod: 'none',
    error: 'No valid authentication found'
  }
}

/**
 * Get authentication info from request
 */
export function getAuthInfo(request: NextRequest): {
  hasBearer: boolean
  bearerToken?: string
} {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { hasBearer: false }
  }
  
  return {
    hasBearer: true,
    bearerToken: authHeader.substring(7)
  }
}