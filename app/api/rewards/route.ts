import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const rewardSchema = z.object({
  name: z.string().min(2, 'Ödül adı en az 2 karakter olmalıdır'),
  description: z.string().min(10, 'Açıklama en az 10 karakter olmalıdır'),
  pointsCost: z.number().min(0).optional(),
  campaignId: z.string().optional(),
  restaurantId: z.string()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {}

    const [rewards, total] = await Promise.all([
      prisma.reward.findMany({
        where,
        skip,
        take: limit,
        include: {
          campaign: {
            select: { name: true }
          },
          _count: {
            select: { 
              customers: true 
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.reward.count({ where })
    ])

    // Get usage stats for each reward
    const rewardsWithStats = await Promise.all(
      rewards.map(async (reward) => {
        const [totalGiven, totalRedeemed] = await Promise.all([
          prisma.customerReward.count({
            where: { rewardId: reward.id }
          }),
          prisma.customerReward.count({
            where: { 
              rewardId: reward.id,
              isRedeemed: true
            }
          })
        ])

        return {
          ...reward,
          stats: {
            totalGiven,
            totalRedeemed,
            redemptionRate: totalGiven > 0 ? Math.round((totalRedeemed / totalGiven) * 100) : 0
          }
        }
      })
    )

    return NextResponse.json({
      rewards: rewardsWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching rewards:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = rewardSchema.parse(body)

    // Add restaurantId from session or validated data
    const rewardData = {
      ...validatedData,
      restaurantId: validatedData.restaurantId || (session.user as any).restaurantId || 'default-restaurant-id'
    }

    const reward = await prisma.reward.create({
      data: rewardData,
      include: {
        campaign: {
          select: { name: true }
        }
      }
    })

    return NextResponse.json(reward, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating reward:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}