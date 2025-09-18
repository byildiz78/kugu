import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth-utils'
import { z } from 'zod'
import { CampaignManager } from '@/lib/campaign-manager'
import { processTransactionItems } from '@/lib/utils/item-resolver'

const prepareSchema = z.object({
  customerId: z.string(),
  items: z.array(z.object({
    productId: z.string().optional(),
    menuItemKey: z.string().optional(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0).optional() // Make optional for menuItemKey resolution
  }).refine(
    (item) => item.productId || item.menuItemKey,
    "Either productId or menuItemKey must be provided"
  )),
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

    // Get customer first to get restaurantId for item resolution
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { restaurantId: true }
    })

    if (!customer) {
      return NextResponse.json({
        error: 'Customer not found',
        message: `No customer found with ID: ${customerId}`
      }, { status: 404 })
    }

    // Debug: Log customer restaurant ID
    console.log(`[Prepare] Customer restaurant ID: ${customer.restaurantId}`)

    // Process items: resolve menuItemKeys to productIds and enrich with product details
    const resolvedItems = await processTransactionItems(items, customer.restaurantId)

    // Calculate subtotal using resolved items with product prices
    const subtotal = resolvedItems.reduce((sum, item) => sum + item.totalPrice, 0)

    // Get customer with all relations
    const customerWithRelations = await prisma.customer.findUnique({
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

    if (!customerWithRelations) {
      return NextResponse.json({
        error: 'Customer not found',
        message: `No customer found with ID: ${customerId}`
      }, { status: 404 })
    }

    // Get base point rate
    const basePointRate = customerWithRelations.restaurant.settings?.basePointRate || 0.1
    const tierMultiplier = customerWithRelations.tier?.pointMultiplier || 1.0

    // Calculate points to earn
    const pointsToEarn = Math.floor(subtotal * basePointRate * tierMultiplier)

    // Get eligible campaigns
    const now = new Date()
    const allCampaigns = await prisma.campaign.findMany({
      where: {
        restaurantId: customerWithRelations.restaurantId,
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
        const customerSegmentIds = customerWithRelations.segments.map(cs => cs.segmentId)
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
        restaurantId: customerWithRelations.restaurantId,
        type: 'PRODUCT_BASED',
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now }
      }
    })

    for (const campaign of stampCampaigns) {
      console.log('Processing stamp campaign:', campaign.id, campaign.name)
      console.log('Campaign data:', {
        buyQuantity: campaign.buyQuantity,
        getQuantity: campaign.getQuantity,
        targetProducts: campaign.targetProducts,
        freeProducts: campaign.freeProducts
      })

      // Use direct schema fields like customer endpoint
      if (!campaign.buyQuantity || !campaign.freeProducts) {
        console.log('Skipping campaign due to missing buyQuantity or freeProducts')
        continue
      }

      // Parse target products (same as customer endpoint)
      let targetProductIds: string[] = []
      if (campaign.targetProducts) {
        try {
          targetProductIds = JSON.parse(campaign.targetProducts)
        } catch (e) {
          targetProductIds = []
        }
      }
      const qualifyingTransactions = await prisma.transactionItem.findMany({
        where: {
          transaction: {
            customerId,
            status: 'COMPLETED',
            createdAt: {
              gte: campaign.startDate || new Date(0)
            }
          },
          isFree: false, // Only count paid items for stamps
          ...(targetProductIds.length > 0 && {
            productId: { in: targetProductIds }
          })
        }
      })

      // Calculate total quantity purchased
      const totalPurchased = qualifyingTransactions.reduce((sum, item) => sum + item.quantity, 0)
      console.log(`Campaign ${campaign.name}: totalPurchased=${totalPurchased}, buyQuantity=${campaign.buyQuantity}`)

      // Calculate stamps earned (how many complete sets of buyQuantity)
      const totalStampsEarned = Math.floor(totalPurchased / (campaign.buyQuantity || 1))
      console.log(`totalStampsEarned=${totalStampsEarned}`)

      // Get how many times this campaign was already used (same as mobile/stamps)
      const campaignUsages = await prisma.transactionCampaign.count({
        where: {
          campaignId: campaign.id,
          transaction: {
            customerId
          }
        }
      })

      // Calculate remaining stamps
      const stampsUsed = campaignUsages
      const availableStamps = Math.max(0, totalStampsEarned - stampsUsed)
      console.log(`stampsUsed=${stampsUsed}, availableStamps=${availableStamps}`)

      if (availableStamps > 0) {
        // Parse free products (same as customer endpoint)
        let freeProductIds: string[] = []
        if (campaign.freeProducts) {
          try {
            freeProductIds = JSON.parse(campaign.freeProducts)
          } catch (e) {
            freeProductIds = []
          }
        }

        const freeProductId = freeProductIds[0] || (targetProductIds && targetProductIds[0])
        const freeProduct = await prisma.product.findFirst({
          where: { id: freeProductId },
          select: {
            id: true,
            name: true,
            price: true,
            menuItemKey: true
          }
        })

        eligibleStamps.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          productName: freeProduct?.name || 'Ürün',
          availableStamps,
          stampsNeeded: 1, // Always 1 stamp needed to redeem
          canRedeem: availableStamps >= 1,
          freeProduct: {
            id: freeProductId,
            name: freeProduct?.name || 'Ürün',
            menuItemKey: freeProduct?.menuItemKey || null,
            value: freeProduct?.price || 0
          }
        })
      }
    }

    // Get eligible rewards
    const eligibleRewards = customerWithRelations.rewards
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
        restaurantId: customerWithRelations.restaurantId,
        isActive: true,
        pointsCost: { lte: customerWithRelations.points }
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
    const maxPointValue = customerWithRelations.points * 0.1 // 1 point = 0.1 TL
    const maxPointDiscount = Math.min(maxPointValue, subtotal * 0.5)

    // Prepare response
    const response = {
      customer: {
        id: customerWithRelations.id,
        name: customerWithRelations.name,
        availablePoints: customerWithRelations.points,
        tier: customerWithRelations.tier ? {
          id: customerWithRelations.tier.id,
          name: customerWithRelations.tier.name,
          displayName: customerWithRelations.tier.displayName,
          pointMultiplier: customerWithRelations.tier.pointMultiplier
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