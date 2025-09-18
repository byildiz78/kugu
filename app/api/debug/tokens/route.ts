import { NextRequest, NextResponse } from 'next/server'
import { reservationTokenService } from '@/lib/services/reservation-token.service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (token) {
      // Get specific token info
      const tokenInfo = reservationTokenService.getTokenInfo(token)
      return NextResponse.json({
        token,
        info: tokenInfo
      })
    } else {
      // Get all tokens stats
      const stats = reservationTokenService.getStats()
      return NextResponse.json(stats)
    }

  } catch (error) {
    console.error('Error in debug tokens endpoint:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}