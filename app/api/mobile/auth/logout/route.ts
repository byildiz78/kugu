import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Çıkış yapıldı'
    })

    // Clear auth cookie
    response.cookies.delete('mobile-auth-token')

    return response

  } catch (error) {
    console.error('Logout API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Sistem hatası'
    }, { status: 500 })
  }
}