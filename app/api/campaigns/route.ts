import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { authenticateRequest } from '@/lib/auth-utils'

const campaignSchema = z.object({
  name: z.string().min(2, 'Kampanya adı en az 2 karakter olmalıdır'),
  description: z.string().min(10, 'Açıklama en az 10 karakter olmalıdır'),
  type: z.enum(['DISCOUNT', 'PRODUCT_BASED', 'LOYALTY_POINTS', 'TIME_BASED', 'BIRTHDAY_SPECIAL', 'COMBO_DEAL', 'BUY_X_GET_Y', 'CATEGORY_DISCOUNT', 'REWARD_CAMPAIGN']),
  startDate: z.string(),
  endDate: z.string(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_ITEM', 'BUY_ONE_GET_ONE']),
  discountValue: z.number().min(0),
  minPurchase: z.number().optional(),
  maxUsage: z.number().optional(),
  maxUsagePerCustomer: z.number().default(1),
  validHours: z.string().optional(),
  validDays: z.string().optional(),
  
  // Product/Category settings
  targetProducts: z.string().nullable().optional(),
  targetCategories: z.string().nullable().optional(),
  freeProducts: z.string().nullable().optional(),
  freeCategories: z.string().nullable().optional(),
  
  // Buy-X-Get-Y settings
  buyQuantity: z.number().optional(),
  getQuantity: z.number().optional(),
  buyFromCategory: z.string().optional(),
  getFromCategory: z.string().optional(),
  getSpecificProduct: z.string().nullable().optional(),
  
  // Reward integration
  rewardIds: z.string().optional(),
  autoGiveReward: z.boolean().default(false),
  
  pointsMultiplier: z.number().default(1),
  pointsRequired: z.number().optional(),
  sendNotification: z.boolean().default(true),
  notificationTitle: z.string().optional().nullable(),
  notificationMessage: z.string().optional().nullable(),
  segmentIds: z.array(z.string()).optional(),
  restaurantId: z.string()
})

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'Valid session or Bearer token required' 
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status') || ''

    const skip = (page - 1) * limit

    const where: any = {
      AND: [
        search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } }
          ]
        } : {},
        type ? { type } : {},
        status === 'active' ? { isActive: true } : {},
        status === 'inactive' ? { isActive: false } : {}
      ]
    }

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        include: {
          restaurant: {
            select: { name: true }
          },
          segments: {
            select: { id: true, name: true }
          },
          _count: {
            select: { 
              usages: true,
              transactions: true 
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.campaign.count({ where })
    ])

    return NextResponse.json({
      campaigns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'Valid session or Bearer token required' 
      }, { status: 401 })
    }

    const body = await request.json()
    console.log('=== CAMPAIGN API RECEIVED DATA ===')
    console.log(JSON.stringify(body, null, 2))
    
    try {
      const { segmentIds, ...campaignData } = campaignSchema.parse(body)
      console.log('=== VALIDATION SUCCESSFUL ===')
    } catch (validationError) {
      console.log('=== VALIDATION ERROR ===')
      console.error(validationError)
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationError 
      }, { status: 400 })
    }
    
    const { segmentIds, ...campaignData } = campaignSchema.parse(body)

    // Verify that the restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: campaignData.restaurantId }
    })

    if (!restaurant) {
      console.error('Restaurant not found:', campaignData.restaurantId)
      return NextResponse.json({ 
        error: 'Restaurant not found',
        restaurantId: campaignData.restaurantId 
      }, { status: 400 })
    }

    console.log('=== CREATING CAMPAIGN ===')
    console.log('Restaurant found:', restaurant.name)

    const campaign = await prisma.campaign.create({
      data: {
        ...campaignData,
        startDate: new Date(campaignData.startDate),
        endDate: new Date(campaignData.endDate),
        segments: segmentIds ? {
          connect: segmentIds.map(id => ({ id }))
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

    return NextResponse.json(campaign, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating campaign:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}