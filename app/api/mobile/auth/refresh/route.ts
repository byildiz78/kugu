import { NextRequest, NextResponse } from 'next/server'
import { refreshMobileToken } from '@/lib/mobile-auth'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('mobile-auth-token')?.value

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Token bulunamadı'
      }, { status: 401 })
    }

    const result = await refreshMobileToken(token)

    if (result.success && result.newToken) {
      const response = NextResponse.json({
        success: true,
        message: 'Token yenilendi'
      })

      // Update cookie with new token
      response.cookies.set('mobile-auth-token', result.newToken, {
        httpOnly: true,
        secure: false, // Set to false since we're using HTTP not HTTPS
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/'
      })

      return response
    } else {
      // Clear invalid token
      const response = NextResponse.json({
        success: false,
        error: 'Geçersiz token'
      }, { status: 401 })

      response.cookies.delete('mobile-auth-token')
      return response
    }

  } catch (error) {
    console.error('Token refresh API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Sistem hatası'
    }, { status: 500 })
  }
}