import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rule = await prisma.rewardRule.findUnique({
      where: { id: params.id },
      include: {
        reward: {
          select: { name: true, type: true, restaurantId: true }
        }
      }
    })

    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    // Check access rights
    if (session.user.role !== 'ADMIN' && rule.reward.restaurantId !== (session.user as any).restaurantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ rule })
  } catch (error) {
    console.error('Error fetching reward rule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and restaurant staff can update reward rules
    if (!['ADMIN', 'RESTAURANT_ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { triggerType, triggerValue, periodType, categoryFilter, timeRestriction, isActive } = body

    // Check if rule exists
    const existingRule = await prisma.rewardRule.findUnique({
      where: { id: params.id },
      include: {
        reward: { select: { restaurantId: true } }
      }
    })

    if (!existingRule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    // Check access rights
    if (session.user.role !== 'ADMIN' && existingRule.reward.restaurantId !== (session.user as any).restaurantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Prepare update data
    const updateData: any = {}
    if (triggerType !== undefined) updateData.triggerType = triggerType
    if (triggerValue !== undefined) updateData.triggerValue = parseInt(triggerValue)
    if (periodType !== undefined) updateData.periodType = periodType
    if (categoryFilter !== undefined) updateData.categoryFilter = categoryFilter ? JSON.stringify(categoryFilter) : null
    if (timeRestriction !== undefined) updateData.timeRestriction = timeRestriction ? JSON.stringify(timeRestriction) : null
    if (isActive !== undefined) updateData.isActive = isActive

    const rule = await prisma.rewardRule.update({
      where: { id: params.id },
      data: updateData,
      include: {
        reward: {
          select: { name: true, type: true }
        }
      }
    })

    return NextResponse.json({ rule })
  } catch (error) {
    console.error('Error updating reward rule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and restaurant staff can delete reward rules
    if (!['ADMIN', 'RESTAURANT_ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if rule exists
    const existingRule = await prisma.rewardRule.findUnique({
      where: { id: params.id },
      include: {
        reward: { select: { restaurantId: true } }
      }
    })

    if (!existingRule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    // Check access rights
    if (session.user.role !== 'ADMIN' && existingRule.reward.restaurantId !== (session.user as any).restaurantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.rewardRule.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Rule deleted successfully' })
  } catch (error) {
    console.error('Error deleting reward rule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}