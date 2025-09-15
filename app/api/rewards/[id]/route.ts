import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateRewardSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  pointsCost: z.number().min(0).optional().nullable(),
  campaignId: z.string().optional().nullable()
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

    const reward = await prisma.reward.findUnique({
      where: { id: params.id },
      include: {
        campaign: {
          select: { name: true }
        },
        customers: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                points: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
    }

    return NextResponse.json(reward)
  } catch (error) {
    console.error('Error fetching reward:', error)
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

    const body = await request.json()
    const validatedData = updateRewardSchema.parse(body)

    const reward = await prisma.reward.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        campaign: {
          select: { name: true }
        }
      }
    })

    return NextResponse.json(reward)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating reward:', error)
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

    // Check if reward has been given to any customer
    const customerRewardCount = await prisma.customerReward.count({
      where: { rewardId: params.id }
    })

    if (customerRewardCount > 0) {
      return NextResponse.json({ 
        error: 'Bu ödül müşterilere verilmiş, silinemez' 
      }, { status: 400 })
    }

    await prisma.reward.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Reward deleted successfully' })
  } catch (error) {
    console.error('Error deleting reward:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}