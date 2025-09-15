import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

export async function GET() {
  return NextResponse.json({
    message: 'Auth test endpoint',
    authOptions: {
      providers: authOptions.providers.map(p => p.id),
      session: authOptions.session,
      pages: authOptions.pages,
      debug: authOptions.debug
    },
    env: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET'
    }
  })
}