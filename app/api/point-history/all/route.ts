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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') // EARNED, SPENT, EXPIRED
    const source = searchParams.get('source') // PURCHASE, REWARD, BONUS, etc.
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * limit

    const where: any = {}

    if (type && type !== 'all') {
      where.type = type
    }

    if (source && source !== 'all') {
      where.source = source
    }

    // Date filtering
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        // End of day for end date
        const endOfDay = new Date(endDate)
        endOfDay.setHours(23, 59, 59, 999)
        where.createdAt.lte = endOfDay
      }
    }

    const [pointHistory, total] = await Promise.all([
      prisma.pointHistory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { 
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.pointHistory.count({ where })
    ])

    return NextResponse.json({
      pointHistory,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching all point history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}