import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get aggregated statistics
    const [earnedStats, spentStats, expiredStats] = await Promise.all([
      // Total earned points
      prisma.pointHistory.aggregate({
        where: { type: 'EARNED' },
        _sum: { amount: true }
      }),
      // Total spent points  
      prisma.pointHistory.aggregate({
        where: { type: 'SPENT' },
        _sum: { amount: true }
      }),
      // Total expired points
      prisma.pointHistory.aggregate({
        where: { type: 'EXPIRED' },
        _sum: { amount: true }
      })
    ])

    const totalEarned = earnedStats._sum.amount || 0
    const totalSpent = spentStats._sum.amount || 0
    const totalExpired = expiredStats._sum.amount || 0
    const netBalance = totalEarned + totalSpent + totalExpired // spent and expired are negative

    const stats = {
      totalEarned,
      totalSpent,
      totalExpired,
      netBalance
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching point history stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}