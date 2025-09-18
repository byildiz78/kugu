import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is superadmin
    if (!session || (session.user.email !== 'superadmin@aircrm.com' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Superadmin access required'
      }, { status: 403 })
    }

    const [customers, pointHistory, campaignUsage] = await Promise.all([
      prisma.customer.count(),
      prisma.pointHistory.count(),
      prisma.campaignUsage.count()
    ])

    return NextResponse.json({
      customers,
      pointHistory,
      campaignUsage
    })

  } catch (error) {
    console.error('Error fetching DB stats:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}