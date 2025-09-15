import { NextRequest, NextResponse } from 'next/server'
import { verifyMobileToken } from '@/lib/mobile-auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('mobile-auth-token')?.value

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Token bulunamadı'
      }, { status: 401 })
    }

    const verification = await verifyMobileToken(token)

    if (verification.valid && verification.customer) {
      return NextResponse.json({
        success: true,
        customer: verification.customer
      })
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
    console.error('Auth me API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Sistem hatası'
    }, { status: 500 })
  }
}