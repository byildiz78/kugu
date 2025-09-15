import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { rewardEvents } from '@/lib/events/reward.events'
import { queueSegmentUpdate } from '@/lib/segment-queue'
import { tierService } from '@/lib/services/tier.service'
import { authenticateRequest } from '@/lib/auth-utils'

const transactionItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  category: z.string().optional(),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  totalPrice: z.number().min(0),
  discountAmount: z.number().default(0),
  isFree: z.boolean().default(false),
  notes: z.string().optional()
})

const transactionSchema = z.object({
  customerId: z.string(),
  orderNumber: z.string(),
  totalAmount: z.number().min(0),
  discountAmount: z.number().default(0),
  finalAmount: z.number().min(0),
  pointsUsed: z.number().default(0),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(transactionItemSchema),
  appliedCampaigns: z.array(z.object({
    campaignId: z.string(),
    discountAmount: z.number(),
    freeItems: z.array(z.string()).optional(),
    pointsEarned: z.number().default(0)
  })).optional()
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
    const limit = parseInt(searchParams.get('limit') || '20')
    const customerId = searchParams.get('customerId')
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * limit

    const where: any = {}

    // Customer filter
    if (customerId) {
      where.customerId = customerId
    }

    // Search filter (order number or customer name/email)
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { email: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Status filter
    if (status && status !== 'ALL') {
      where.status = status
    }

    // Date filtering
    if (startDate || endDate) {
      where.transactionDate = {}
      if (startDate) {
        where.transactionDate.gte = new Date(startDate)
      }
      if (endDate) {
        // End of day for end date
        const endOfDay = new Date(endDate)
        endOfDay.setHours(23, 59, 59, 999)
        where.transactionDate.lte = endOfDay
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: {
            select: { name: true, email: true, level: true }
          },
          tier: {
            select: { 
              id: true,
              name: true, 
              displayName: true, 
              color: true,
              pointMultiplier: true 
            }
          },
          items: true,
          appliedCampaigns: {
            include: {
              campaign: {
                select: { name: true, type: true }
              }
            }
          }
        },
        orderBy: { transactionDate: 'desc' }
      }),
      prisma.transaction.count({ where })
    ])

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
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
    const validatedData = transactionSchema.parse(body)

    // Get customer with tier for point calculation
    const customer = await prisma.customer.findUnique({
      where: { id: validatedData.customerId },
      include: { 
        tier: true,
        restaurant: {
          include: { settings: true }
        }
      }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Get base point rate from settings (default: 0.1 = 10 TL per 1 point)
    const basePointRate = customer.restaurant.settings?.basePointRate || 0.1
    
    // Get tier-specific point multiplier (default: 1.0)
    const tierPointMultiplier = customer.tier?.pointMultiplier || 1.0
    
    // Check if orderNumber already exists
    const existingTransaction = await prisma.transaction.findUnique({
      where: { orderNumber: validatedData.orderNumber }
    })
    
    if (existingTransaction) {
      return NextResponse.json({
        error: 'Bu siparişe ait zaten kayıtlı işlem var',
        orderNumber: validatedData.orderNumber
      }, { status: 409 })
    }

    // Calculate points earned: amount * baseRate * tierMultiplier
    // Example: 100 TL * 0.1 * 2.0 = 20 points (for a tier with 2x multiplier)
    const pointsEarned = Math.floor(validatedData.finalAmount * basePointRate * tierPointMultiplier)

    const transaction = await prisma.transaction.create({
      data: {
        orderNumber: validatedData.orderNumber,
        totalAmount: validatedData.totalAmount,
        discountAmount: validatedData.discountAmount,
        finalAmount: validatedData.finalAmount,
        pointsEarned,
        pointsUsed: validatedData.pointsUsed,
        paymentMethod: validatedData.paymentMethod,
        notes: validatedData.notes,
        customerId: validatedData.customerId,
        tierId: customer.tier?.id,
        tierMultiplier: tierPointMultiplier,
        items: {
          create: validatedData.items
        },
        appliedCampaigns: validatedData.appliedCampaigns ? {
          create: validatedData.appliedCampaigns.map((campaign: any) => ({
            discountAmount: campaign.discountAmount,
            pointsEarned: campaign.pointsEarned,
            freeItems: campaign.freeItems ? JSON.stringify(campaign.freeItems) : null,
            campaign: { connect: { id: campaign.campaignId } }
          }))
        } : undefined
      },
      include: {
        customer: {
          select: { name: true, email: true }
        },
        items: true,
        appliedCampaigns: {
          include: {
            campaign: {
              select: { name: true }
            }
          }
        }
      }
    })

    // Check if this is a paid transaction (has non-free items or finalAmount > 0)
    const hasPaidItems = validatedData.items.some(item => !item.isFree) || validatedData.finalAmount > 0
    
    // Update customer stats and last visit (points will be updated via event system)
    const updatedCustomer = await prisma.customer.update({
      where: { id: validatedData.customerId },
      data: {
        totalSpent: {
          increment: validatedData.finalAmount
        },
        visitCount: {
          // Only increment visit count for paid transactions (for stamp campaigns)
          increment: hasPaidItems ? 1 : 0
        },
        lastVisit: new Date()
      }
    })

    // Emit events for reward processing
    if (pointsEarned > 0) {
      rewardEvents.emitPointsEarned(
        validatedData.customerId,
        pointsEarned,
        'PURCHASE',
        transaction.id
      )
    }

    if (validatedData.pointsUsed > 0) {
      rewardEvents.emitPointsSpent(
        validatedData.customerId,
        validatedData.pointsUsed,
        'PURCHASE',
        transaction.id
      )
    }

    // Emit transaction completed for reward processing
    rewardEvents.emitTransactionCompleted(
      transaction.id,
      validatedData.customerId,
      validatedData.finalAmount
    )

    // Get current customer points for milestone checking
    const currentCustomer = await prisma.customer.findUnique({
      where: { id: validatedData.customerId },
      select: { points: true }
    })
    
    // Calculate expected new points (after event processing)
    const expectedNewPoints = (currentCustomer?.points || 0) + pointsEarned - validatedData.pointsUsed

    // Check for milestone achievements
    const milestones = [
      { type: 'TOTAL_SPENT', values: [100, 500, 1000, 2500, 5000] },
      { type: 'VISIT_COUNT', values: [5, 10, 25, 50, 100] },
      { type: 'POINTS_MILESTONE', values: [100, 500, 1000, 2500, 5000] }
    ]

    for (const milestone of milestones) {
      for (const value of milestone.values) {
        if (
          (milestone.type === 'TOTAL_SPENT' && updatedCustomer.totalSpent >= value && updatedCustomer.totalSpent - validatedData.finalAmount < value) ||
          (milestone.type === 'VISIT_COUNT' && updatedCustomer.visitCount === value) ||
          (milestone.type === 'POINTS_MILESTONE' && expectedNewPoints >= value && (currentCustomer?.points || 0) < value)
        ) {
          rewardEvents.emitMilestoneReached(
            validatedData.customerId,
            milestone.type,
            value
          )
        }
      }
    }

    // Check for tier upgrade
    try {
      const upgradedTier = await tierService.checkAndUpgradeTier(
        validatedData.customerId, 
        'TRANSACTION_COMPLETED'
      )
      
      if (upgradedTier) {
        console.log(`Customer ${validatedData.customerId} upgraded to tier: ${upgradedTier.displayName}`)
      }
    } catch (error) {
      console.error('Error checking tier upgrade:', error)
      // Don't fail the transaction if tier upgrade fails
    }

    // Queue automatic segment update (debounced)
    queueSegmentUpdate(validatedData.customerId)

    return NextResponse.json(transaction, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    
    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      console.error('Unique constraint violation:', error.meta)
      return NextResponse.json({ 
        error: 'Duplicate order number. Please try again.', 
        details: error.meta 
      }, { status: 409 })
    }
    
    console.error('Error creating transaction:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    }, { status: 500 })
  }
}