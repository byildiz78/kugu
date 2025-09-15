import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateCampaignSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  type: z.enum(['DISCOUNT', 'PRODUCT_BASED', 'LOYALTY_POINTS', 'TIME_BASED', 'BIRTHDAY_SPECIAL', 'COMBO_DEAL', 'BUY_X_GET_Y', 'CATEGORY_DISCOUNT', 'REWARD_CAMPAIGN']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_ITEM', 'BUY_ONE_GET_ONE']).optional(),
  discountValue: z.number().min(0).optional(),
  minPurchase: z.number().optional(),
  maxUsage: z.number().optional(),
  maxUsagePerCustomer: z.number().optional(),
  validHours: z.string().nullable().optional(),
  validDays: z.string().nullable().optional(),
  targetProducts: z.string().nullable().optional(),
  targetCategories: z.string().nullable().optional(),
  freeProducts: z.string().nullable().optional(),
  freeCategories: z.string().nullable().optional(),
  buyQuantity: z.number().optional(),
  getQuantity: z.number().optional(),
  buyFromCategory: z.string().nullable().optional(),
  getFromCategory: z.string().nullable().optional(),
  getSpecificProduct: z.string().nullable().optional(),
  rewardIds: z.string().nullable().optional(),
  autoGiveReward: z.boolean().optional(),
  pointsMultiplier: z.number().optional(),
  pointsRequired: z.number().optional(),
  sendNotification: z.boolean().optional(),
  notificationTitle: z.string().optional(),
  notificationMessage: z.string().optional(),
  isActive: z.boolean().optional(),
  segmentIds: z.array(z.string()).optional()
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

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      include: {
        restaurant: {
          select: { name: true }
        },
        segments: {
          select: { id: true, name: true }
        },
        usages: {
          include: {
            customer: {
              select: { name: true, email: true }
            }
          },
          orderBy: { usedAt: 'desc' },
          take: 10
        },
        _count: {
          select: { usages: true }
        }
      }
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    return NextResponse.json(campaign)
  } catch (error) {
    console.error('Error fetching campaign:', error)
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
    console.log('Campaign update request body:', JSON.stringify(body, null, 2))
    
    const { segmentIds, ...updateData } = updateCampaignSchema.parse(body)
    console.log('Parsed update data:', JSON.stringify(updateData, null, 2))
    console.log('Segment IDs:', segmentIds)

    const campaign = await prisma.campaign.update({
      where: { id: params.id },
      data: {
        ...updateData,
        startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
        endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
        segments: segmentIds ? {
          set: segmentIds.map(id => ({ id }))
        } : undefined
      },
      include: {
        restaurant: {
          select: { name: true }
        },
        segments: {
          select: { name: true }
        },
        _count: {
          select: { usages: true }
        }
      }
    })

    return NextResponse.json(campaign)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Zod validation error:', error.errors)
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.errors,
        message: 'Request data validation failed'
      }, { status: 400 })
    }
    console.error('Error updating campaign:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
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

    await prisma.campaign.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Campaign deleted successfully' })
  } catch (error) {
    console.error('Error deleting campaign:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}