import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateTierSchema = z.object({
  name: z.string().min(1).optional(),
  displayName: z.string().min(1).optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  gradient: z.string().optional(),
  icon: z.string().optional(),
  minTotalSpent: z.number().min(0).optional(),
  minVisitCount: z.number().min(0).optional(),
  minPoints: z.number().min(0).optional(),
  level: z.number().min(0).optional(),
  pointMultiplier: z.number().min(0.1).max(10).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  specialFeatures: z.string().optional(),
  isActive: z.boolean().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tier = await prisma.tier.findUnique({
      where: { id: params.id },
      include: {
        customers: {
          select: {
            id: true,
            name: true,
            email: true,
            points: true,
            totalSpent: true,
            visitCount: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        tierHistoryTo: {
          include: {
            customer: {
              select: { name: true, email: true }
            },
            fromTier: {
              select: { name: true, displayName: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            customers: true,
            rewardsMinTier: true
          }
        }
      }
    })

    if (!tier) {
      return NextResponse.json({ error: 'Tier not found' }, { status: 404 })
    }

    return NextResponse.json({ tier })
  } catch (error) {
    console.error('Error fetching tier:', error)
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

    // Only admins and restaurant staff can update tiers
    if (!['ADMIN', 'RESTAURANT_ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateTierSchema.parse(body)

    // Check if tier exists
    const existingTier = await prisma.tier.findUnique({
      where: { id: params.id }
    })

    if (!existingTier) {
      return NextResponse.json({ error: 'Tier not found' }, { status: 404 })
    }

    // Check for name conflicts if name is being updated
    if (validatedData.name && validatedData.name !== existingTier.name) {
      const nameConflict = await prisma.tier.findFirst({
        where: {
          name: validatedData.name,
          restaurantId: existingTier.restaurantId,
          id: { not: params.id }
        }
      })

      if (nameConflict) {
        return NextResponse.json({ error: 'Tier with this name already exists' }, { status: 400 })
      }
    }

    // Check for level conflicts if level is being updated
    if (validatedData.level !== undefined && validatedData.level !== existingTier.level) {
      const levelConflict = await prisma.tier.findFirst({
        where: {
          level: validatedData.level,
          restaurantId: existingTier.restaurantId,
          id: { not: params.id }
        }
      })

      if (levelConflict) {
        return NextResponse.json({ error: 'Tier with this level already exists' }, { status: 400 })
      }
    }

    const updateData: any = { ...validatedData }
    if (validatedData.specialFeatures) {
      updateData.specialFeatures = JSON.stringify(validatedData.specialFeatures)
    }

    const tier = await prisma.tier.update({
      where: { id: params.id },
      data: updateData,
      include: {
        _count: {
          select: {
            customers: true
          }
        }
      }
    })

    return NextResponse.json({ tier })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating tier:', error)
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

    // Only admins and restaurant staff can delete tiers
    if (!['ADMIN', 'RESTAURANT_ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if tier exists
    const tier = await prisma.tier.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            customers: true
          }
        }
      }
    })

    if (!tier) {
      return NextResponse.json({ error: 'Tier not found' }, { status: 404 })
    }

    // Check if tier has customers
    if (tier._count.customers > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete tier with existing customers. Move customers to another tier first.' 
      }, { status: 400 })
    }

    await prisma.tier.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Tier deleted successfully' })
  } catch (error) {
    console.error('Error deleting tier:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}