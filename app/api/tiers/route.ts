import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createTierSchema = z.object({
  name: z.string().min(1, 'Tier name is required'),
  displayName: z.string().min(1, 'Display name is required'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Valid hex color required').default('#6B7280'),
  gradient: z.string().optional(),
  icon: z.string().optional(),
  minTotalSpent: z.number().min(0).optional(),
  minVisitCount: z.number().min(0).optional(),
  minPoints: z.number().min(0).optional(),
  level: z.number().min(0),
  pointMultiplier: z.number().min(0.1).max(10).default(1.0),
  discountPercent: z.number().min(0).max(100).optional(),
  specialFeatures: z.string().optional(),
  isActive: z.boolean().default(true)
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId') || 'default-restaurant-id'
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where: any = { restaurantId }
    if (!includeInactive) {
      where.isActive = true
    }

    const tiers = await prisma.tier.findMany({
      where,
      orderBy: { level: 'asc' },
      include: {
        _count: {
          select: {
            customers: true
          }
        }
      }
    })

    return NextResponse.json({ tiers })
  } catch (error) {
    console.error('Error fetching tiers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and restaurant staff can create tiers
    if (!['ADMIN', 'RESTAURANT_ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createTierSchema.parse(body)

    const restaurantId = 'default-restaurant-id' // TODO: Get from session

    // Check if tier name already exists
    const existingTier = await prisma.tier.findFirst({
      where: {
        name: validatedData.name,
        restaurantId
      }
    })

    if (existingTier) {
      return NextResponse.json({ error: 'Tier with this name already exists' }, { status: 400 })
    }

    // Check if level already exists
    const existingLevel = await prisma.tier.findFirst({
      where: {
        level: validatedData.level,
        restaurantId
      }
    })

    if (existingLevel) {
      return NextResponse.json({ error: 'Tier with this level already exists' }, { status: 400 })
    }

    const tier = await prisma.tier.create({
      data: {
        ...validatedData,
        restaurantId,
        specialFeatures: validatedData.specialFeatures ? JSON.stringify(validatedData.specialFeatures) : null
      },
      include: {
        _count: {
          select: {
            customers: true
          }
        }
      }
    })

    return NextResponse.json({ tier }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating tier:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}