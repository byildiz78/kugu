import { authOptions } from '@/lib/auth'
import NextAuth from 'next-auth'
import { NextRequest } from 'next/server'

// Create handler
const handler = NextAuth(authOptions)

// Export named handlers for each HTTP method
export async function GET(request: NextRequest) {
  return handler(request as any)
}

export async function POST(request: NextRequest) {
  return handler(request as any)
}