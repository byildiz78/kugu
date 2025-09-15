import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const giveRewardSchema = z.object({
  customerIds: z.array(z.string()).min(1),
  expiresAt: z.string().optional()
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { customerIds, expiresAt } = giveRewardSchema.parse(body)

    // Get reward details
    const reward = await prisma.reward.findUnique({
      where: { id: params.id }
    })

    if (!reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
    }

    // Check if customers have enough points (if reward has point cost)
    if (reward.pointsCost && reward.pointsCost > 0) {
      const customers = await prisma.customer.findMany({
        where: {
          id: { in: customerIds }
        },
        select: {
          id: true,
          points: true,
          name: true
        }
      })

      const insufficientPoints = customers.filter(c => c.points < reward.pointsCost!)
      if (insufficientPoints.length > 0) {
        return NextResponse.json({ 
          error: 'Bazı müşterilerin yeterli puanı yok',
          customers: insufficientPoints.map(c => ({
            name: c.name,
            points: c.points,
            required: reward.pointsCost
          }))
        }, { status: 400 })
      }
    }

    // Check for existing rewards
    const existingRewards = await prisma.customerReward.findMany({
      where: {
        rewardId: params.id,
        customerId: { in: customerIds },
        isRedeemed: false
      }
    })

    const existingCustomerIds = existingRewards.map(r => r.customerId)
    const newCustomerIds = customerIds.filter(id => !existingCustomerIds.includes(id))

    if (newCustomerIds.length === 0) {
      return NextResponse.json({ 
        error: 'Tüm seçili müşteriler bu ödüle zaten sahip' 
      }, { status: 400 })
    }

    // Create customer rewards
    const customerRewards = await prisma.customerReward.createMany({
      data: newCustomerIds.map(customerId => ({
        customerId,
        rewardId: params.id,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined
      }))
    })

    // Deduct points if reward has cost
    if (reward.pointsCost && reward.pointsCost > 0) {
      await prisma.customer.updateMany({
        where: {
          id: { in: newCustomerIds }
        },
        data: {
          points: {
            decrement: reward.pointsCost
          }
        }
      })
    }

    return NextResponse.json({ 
      message: `${customerRewards.count} müşteriye ödül verildi`,
      count: customerRewards.count,
      skipped: existingCustomerIds.length
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error giving reward:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}