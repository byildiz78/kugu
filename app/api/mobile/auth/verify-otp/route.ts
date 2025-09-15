import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyOTPDB } from '@/lib/mobile-auth-db'

const verifySchema = z.object({
  phone: z.string().min(10, 'Telefon numarası gerekli'),
  otp: z.string().length(4, 'OTP 4 haneli olmalıdır')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, otp } = verifySchema.parse(body)

    const result = await verifyOTPDB(phone, otp)

    if (result.success) {
      const response = NextResponse.json({
        success: true,
        customer: result.customer,
        isNewCustomer: result.isNewCustomer
      })

      // Set HTTP-only cookie for token
      response.cookies.set('mobile-auth-token', result.token!, {
        httpOnly: true,
        secure: false, // Set to false since we're using HTTP not HTTPS
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/'
      })

      return response
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 })
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz giriş bilgileri'
      }, { status: 400 })
    }

    console.error('OTP verification API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Sistem hatası'
    }, { status: 500 })
  }
}