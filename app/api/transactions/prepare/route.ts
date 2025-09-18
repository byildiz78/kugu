import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth-utils'
import { z } from 'zod'
import { CampaignManager } from '@/lib/campaign-manager'

const prepareSchema = z.object({
  customerId: z.string(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0)
  })),
  location: z.enum(['restaurant', 'online']).optional()
})

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const auth = await authenticateRequest(request)
    if (!auth.isAuthenticated) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Valid session or Bearer token required'
      }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = prepareSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation error',
        details: validationResult.error.flatten().fieldErrors
      }, { status: 400 })
    }

    const { customerId, items, location } = validationResult.data

    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)

    // Get customer with all relations
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        tier: true,
        restaurant: {
          include: { settings: true }
        },
        segments: {
          include: { segment: true }
        },
        rewards: {
          where: {
            isRedeemed: false,
            OR: [
              { expiresAt: null },
              { expiresAt: { gte: new Date() } }
            ]
          },
          include: {
            reward: true
          }
        }
      }
    })

    if (!customer) {
      return NextResponse.json({
        error: 'Customer not found',
        message: `No customer found with ID: ${customerId}`
      }, { status: 404 })
    }

    // Get base point rate
    const basePointRate = customer.restaurant.settings?.basePointRate || 0.1
    const tierMultiplier = customer.tier?.pointMultiplier || 1.0

    // Calculate points to earn
    const pointsToEarn = Math.floor(subtotal * basePointRate * tierMultiplier)

    // Get eligible campaigns
    const now = new Date()
    const allCampaigns = await prisma.campaign.findMany({
      where: {
        restaurantId: customer.restaurantId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now }
      },
      include: {
        segments: true,
        usages: {
          where: { customerId }
        }
      }
    })

    // Filter campaigns based on conditions
    const eligibleCampaigns = []
    for (const campaign of allCampaigns) {
      // Check segment targeting
      if (campaign.segments.length > 0) {
        const customerSegmentIds = customer.segments.map(cs => cs.segmentId)
        const campaignSegmentIds = campaign.segments.map(cs => cs.segmentId)
        const hasMatchingSegment = campaignSegmentIds.some(id => customerSegmentIds.includes(id))

        if (!hasMatchingSegment) continue
      }

      // Check time conditions
      const conditions = campaign.conditions as any
      if (conditions?.validHours || conditions?.validDays) {
        const isTimeValid = CampaignManager.validateTimeConditions(
          conditions.validHours,
          conditions.validDays
        )
        if (!isTimeValid) continue
      }

      // Check minimum purchase
      if (conditions?.minPurchase && subtotal < conditions.minPurchase) {
        continue
      }

      // Check usage limits
      const customerUsageCount = campaign.usages.length
      if ((conditions?.maxUsagePerCustomer && customerUsageCount >= conditions.maxUsagePerCustomer) ||
          (campaign.maxUsagePerCustomer && customerUsageCount >= campaign.maxUsagePerCustomer)) {
        continue
      }

      // Calculate benefit for display
      let benefit = ''
      if (campaign.type === 'DISCOUNT' || campaign.type === 'BIRTHDAY_SPECIAL' || campaign.type === 'TIME_BASED' || campaign.type === 'COMBO_DEAL') {
        if (campaign.discountType === 'PERCENTAGE') {
          benefit = `%${campaign.discountValue} indirim`
        } else if (campaign.discountType === 'FIXED_AMOUNT') {
          benefit = `${campaign.discountValue} TL indirim`
        }
      } else if (campaign.type === 'LOYALTY_POINTS') {
        benefit = `${campaign.rewardValue}x puan kazanım`
      } else if (campaign.type === 'PRODUCT_BASED') {
        benefit = 'Damga kampanyası'
      }

      eligibleCampaigns.push({
        id: campaign.id,
        type: campaign.type,
        name: campaign.name,
        description: campaign.description || '',
        discountType: campaign.discountType,
        discountValue: campaign.discountValue || 0,
        benefit,
        autoApply: campaign.autoApply || false,
        conditions: {
          minPurchase: conditions?.minPurchase,
          maxUsage: conditions?.maxUsage,
          currentUsage: campaign.usages.length
        }
      })
    }

    // Get stamp campaigns and calculate available stamps
    const eligibleStamps = []
    const stampCampaigns = await prisma.campaign.findMany({
      where: {
        restaurantId: customer.restaurantId,
        type: 'PRODUCT_BASED',
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now }
      }
    })

    for (const campaign of stampCampaigns) {
      const conditions = campaign.conditions as any
      if (!conditions || !conditions.productIds || !Array.isArray(conditions.productIds) ||
          !conditions.buyQuantity || !conditions.getQuantity) {
        continue
      }

      // Count stamps earned from past transactions
      const earnedTransactions = await prisma.transaction.findMany({
        where: {
          customerId,
          status: 'COMPLETED',
          appliedCampaigns: {
            some: { campaignId: campaign.id }
          }
        },
        include: {
          items: {
            where: {
              productId: { in: conditions.productIds }
            }
          }
        }
      })

      const totalPurchased = earnedTransactions.reduce((sum, tx) => {
        return sum + tx.items.reduce((itemSum, item) => itemSum + item.quantity, 0)
      }, 0)

      const totalStampsEarned = Math.floor(totalPurchased / conditions.buyQuantity)

      // Count stamps used - simplified approach
      const usedStamps = await prisma.campaignUsage.count({
        where: {
          customerId,
          campaignId: campaign.id,
          discountAmount: { gt: 0 } // Stamp redemptions have discount amount > 0
        }
      })

      const availableStamps = totalStampsEarned - usedStamps
      const stampsNeeded = conditions.buyQuantity

      if (availableStamps > 0) {
        // Get product info for free item
        const freeProductId = conditions.freeProductId || (conditions.productIds && conditions.productIds[0])
        const freeProduct = await prisma.product.findFirst({
          where: { id: freeProductId }
        })

        eligibleStamps.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          productName: freeProduct?.name || 'Ürün',
          availableStamps,
          stampsNeeded,
          canRedeem: availableStamps >= 1,
          freeProduct: {
            id: freeProductId,
            name: freeProduct?.name || 'Ürün',
            value: freeProduct?.price || 0
          }
        })
      }
    }

    // Get eligible rewards
    const eligibleRewards = customer.rewards
      .filter(cr => !cr.isRedeemed && cr.reward.isActive)
      .map(cr => ({
        id: cr.reward.id,
        name: cr.reward.name,
        description: cr.reward.description || '',
        pointCost: cr.reward.pointsCost || 0,
        type: cr.reward.type,
        value: cr.reward.value
      }))

    // Add point-purchasable rewards
    const pointRewards = await prisma.reward.findMany({
      where: {
        restaurantId: customer.restaurantId,
        isActive: true,
        pointsCost: { lte: customer.points }
        // minTierNewId filter removed for now - will add proper tier filtering later
      }
    })

    for (const reward of pointRewards) {
      // Check if not already in customer rewards
      const alreadyHas = eligibleRewards.some(r => r.id === reward.id)
      if (!alreadyHas) {
        eligibleRewards.push({
          id: reward.id,
          name: reward.name,
          description: reward.description || '',
          pointCost: reward.pointsCost || 0,
          type: reward.type,
          value: reward.value
        })
      }
    }

    // Calculate max point discount (typically 50% of order or available points)
    const maxPointValue = customer.points * 0.1 // 1 point = 0.1 TL
    const maxPointDiscount = Math.min(maxPointValue, subtotal * 0.5)

    // Prepare response
    const response = {
      customer: {
        id: customer.id,
        name: customer.name,
        availablePoints: customer.points,
        tier: customer.tier ? {
          id: customer.tier.id,
          name: customer.tier.name,
          displayName: customer.tier.displayName,
          pointMultiplier: customer.tier.pointMultiplier
        } : null
      },
      eligibleCampaigns,
      eligibleStamps,
      eligibleRewards,
      calculations: {
        subtotal,
        maxPointDiscount: Math.floor(maxPointDiscount),
        pointsToEarn,
        tierMultiplier
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error preparing transaction:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}