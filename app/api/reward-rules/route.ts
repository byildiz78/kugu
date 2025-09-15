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
    const rewardId = searchParams.get('rewardId')

    const where: any = {}
    if (rewardId) {
      where.rewardId = rewardId
    }

    const rules = await prisma.rewardRule.findMany({
      where,
      include: {
        reward: {
          select: { name: true, type: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ rules })
  } catch (error) {
    console.error('Error fetching reward rules:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and restaurant staff can create reward rules
    if (!['ADMIN', 'RESTAURANT_ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { rewardId, triggerType, triggerValue, periodType, categoryFilter, timeRestriction, isActive } = body

    // Validate required fields
    if (!rewardId || !triggerType || triggerValue === undefined) {
      return NextResponse.json({ 
        error: 'RewardId, triggerType, and triggerValue are required' 
      }, { status: 400 })
    }

    // Check if reward exists and user has access
    const reward = await prisma.reward.findUnique({
      where: { id: rewardId },
      include: { restaurant: true }
    })

    if (!reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
    }

    // Check access rights
    if (session.user.role !== 'ADMIN' && reward.restaurantId !== (session.user as any).restaurantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const rule = await prisma.rewardRule.create({
      data: {
        rewardId,
        triggerType,
        triggerValue: parseInt(triggerValue),
        periodType: periodType || 'LIFETIME',
        categoryFilter: categoryFilter ? JSON.stringify(categoryFilter) : null,
        timeRestriction: timeRestriction ? JSON.stringify(timeRestriction) : null,
        isActive: isActive !== false
      },
      include: {
        reward: {
          select: { name: true, type: true }
        }
      }
    })

    return NextResponse.json({ rule }, { status: 201 })
  } catch (error) {
    console.error('Error creating reward rule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}