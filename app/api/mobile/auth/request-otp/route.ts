import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requestOTPDB } from '@/lib/mobile-auth-db'

const requestSchema = z.object({
  phone: z.string().min(10, 'Telefon numarası gerekli')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('OTP request body:', body)
    
    const { phone } = requestSchema.parse(body)
    console.log('Parsed phone:', phone)

    const result = await requestOTPDB(phone)
    console.log('OTP request result:', result)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Doğrulama kodu gönderildi'
      })
    } else {
      console.error('OTP request failed:', result.error)
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 })
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors)
      return NextResponse.json({
        success: false,
        error: 'Geçersiz telefon numarası',
        details: error.errors
      }, { status: 400 })
    }

    console.error('OTP request API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Sistem hatası'
    }, { status: 500 })
  }
}