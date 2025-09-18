import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth-utils'
import { z } from 'zod'
import { CampaignManager } from '@/lib/campaign-manager'
import {
  reservationTokenService,
  TransactionItem,
  AppliedCampaign,
  StampUsage,
  RewardUsage
} from '@/lib/services/reservation-token.service'

const previewSchema = z.object({
  customerId: z.string(),
  items: z.array(z.object({
    productId: z.string(),
    productName: z.string(),
    category: z.string().optional(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0)
  })),
  selections: z.object({
    usePoints: z.number().min(0).optional(),
    campaignIds: z.array(z.string()).optional(),
    redeemStampIds: z.array(z.string()).optional(),
    rewardIds: z.array(z.string()).optional()
  })
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
    const validationResult = previewSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation error',
        details: validationResult.error.flatten().fieldErrors
      }, { status: 400 })
    }

    const { customerId, items, selections } = validationResult.data

    // Get customer with all necessary relations
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        tier: true,
        restaurant: {
          include: { settings: true }
        }
      }
    })

    if (!customer) {
      return NextResponse.json({
        error: 'Customer not found',
        message: `No customer found with ID: ${customerId}`
      }, { status: 404 })
    }

    // Initialize calculation variables
    const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
    let totalDiscount = 0
    let finalAmount = subtotal
    const warnings: string[] = []
    const errors: string[] = []

    // Prepare transaction items
    const transactionItems: TransactionItem[] = items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      category: item.category,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.unitPrice * item.quantity,
      discountAmount: 0,
      isFree: false
    }))

    // Campaign discounts
    const appliedCampaigns: AppliedCampaign[] = []
    const campaignDiscounts: any[] = []

    if (selections.campaignIds && selections.campaignIds.length > 0) {
      const campaigns = await prisma.campaign.findMany({
        where: {
          id: { in: selections.campaignIds },
          isActive: true
        }
      })

      for (const campaign of campaigns) {
        const conditions = campaign.conditions as any

        // Validate campaign conditions
        if (conditions?.minPurchase && subtotal < conditions.minPurchase) {
          warnings.push(`${campaign.name}: Minimum tutar sağlanmıyor (Min: ${conditions.minPurchase} TL)`)
          continue
        }

        // Check usage limit
        const usageCount = await prisma.campaignUsage.count({
          where: {
            customerId,
            campaignId: campaign.id
          }
        })

        if ((conditions?.maxUsagePerCustomer && usageCount >= conditions.maxUsagePerCustomer) ||
            (campaign.maxUsagePerCustomer && usageCount >= campaign.maxUsagePerCustomer)) {
          warnings.push(`${campaign.name}: Kullanım limiti doldu`)
          continue
        }

        // Calculate discount
        let discountAmount = 0
        if (campaign.type === 'DISCOUNT' || campaign.type === 'BIRTHDAY_SPECIAL' || campaign.type === 'TIME_BASED' || campaign.type === 'COMBO_DEAL') {
          discountAmount = CampaignManager.calculateDiscount(
            finalAmount,
            campaign.discountType || 'PERCENTAGE',
            campaign.discountValue || 0,
            conditions?.minPurchase
          )

          if (discountAmount > 0) {
            campaignDiscounts.push({
              campaignId: campaign.id,
              campaignName: campaign.name,
              discountType: campaign.discountType,
              amount: discountAmount
            })

            appliedCampaigns.push({
              campaignId: campaign.id,
              campaignName: campaign.name,
              discountType: campaign.discountType as 'PERCENTAGE' | 'FIXED_AMOUNT',
              discountAmount,
              pointsEarned: 0
            })

            totalDiscount += discountAmount
            finalAmount -= discountAmount
          }
        } else if (campaign.type === 'LOYALTY_POINTS') {
          // Points will be calculated on final amount
          appliedCampaigns.push({
            campaignId: campaign.id,
            campaignName: campaign.name,
            discountType: 'PERCENTAGE',
            discountAmount: 0,
            pointsEarned: 0 // Will be calculated later
          })
        }
      }
    }

    // Stamp redemptions
    const usedStamps: StampUsage[] = []
    const stampProducts: any[] = []

    if (selections.redeemStampIds && selections.redeemStampIds.length > 0) {
      for (const campaignId of selections.redeemStampIds) {
        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId }
        })

        if (!campaign) {
          warnings.push(`Damga kampanyası bulunamadı: ${campaignId}`)
          continue
        }

        const conditions = campaign.conditions as any

        // Check available stamps
        const earnedTransactions = await prisma.transaction.findMany({
          where: {
            customerId,
            status: 'COMPLETED',
            appliedCampaigns: {
              some: { campaignId }
            }
          },
          include: {
            items: {
              where: {
                productId: { in: conditions.productIds || [] }
              }
            }
          }
        })

        const totalPurchased = earnedTransactions.reduce((sum, tx) => {
          return sum + tx.items.reduce((itemSum, item) => itemSum + item.quantity, 0)
        }, 0)

        const totalStampsEarned = Math.floor(totalPurchased / (conditions.buyQuantity || 1))

        // Count stamps used - simplified approach
        const usedStampCount = await prisma.campaignUsage.count({
          where: {
            customerId,
            campaignId,
            discountAmount: { gt: 0 } // Stamp redemptions have discount amount > 0
          }
        })

        const availableStamps = totalStampsEarned - usedStampCount

        if (availableStamps < 1) {
          warnings.push(`${campaign.name}: Yeterli damga yok`)
          continue
        }

        // Get free product info
        const freeProductId = conditions.freeProductId || conditions.productIds?.[0]
        const freeProduct = await prisma.product.findFirst({
          where: { id: freeProductId }
        })

        const stampValue = freeProduct?.price || 0

        stampProducts.push({
          campaignId,
          productName: freeProduct?.name || 'Bedava Ürün',
          value: stampValue,
          quantity: 1
        })

        usedStamps.push({
          campaignId,
          campaignName: campaign.name,
          productName: freeProduct?.name || 'Bedava Ürün',
          quantity: 1,
          value: stampValue
        })

        // Add free product as transaction item
        transactionItems.push({
          productId: freeProductId,
          productName: freeProduct?.name || 'Bedava Ürün',
          category: freeProduct?.category,
          quantity: 1,
          unitPrice: stampValue,
          totalPrice: stampValue,
          discountAmount: stampValue,
          isFree: true
        })

        totalDiscount += stampValue
      }
    }

    // Reward redemptions
    const usedRewards: RewardUsage[] = []
    const rewardDiscounts: any[] = []

    if (selections.rewardIds && selections.rewardIds.length > 0) {
      const rewards = await prisma.reward.findMany({
        where: {
          id: { in: selections.rewardIds },
          isActive: true
        }
      })

      for (const reward of rewards) {
        // Check if customer has this reward
        const customerReward = await prisma.customerReward.findFirst({
          where: {
            customerId,
            rewardId: reward.id,
            isRedeemed: false
          }
        })

        let needsPoints = false
        if (!customerReward) {
          // Check if can purchase with points
          if ((reward.pointsCost || 0) > 0 && customer.points >= (reward.pointsCost || 0)) {
            needsPoints = true
          } else {
            warnings.push(`${reward.name}: Bu ödüle sahip değilsiniz veya yeterli puanınız yok`)
            continue
          }
        }

        if (reward.type === 'DISCOUNT') {
          const discountAmount = Math.min(reward.value || 0, finalAmount)

          rewardDiscounts.push({
            rewardId: reward.id,
            rewardName: reward.name,
            discount: discountAmount
          })

          usedRewards.push({
            rewardId: reward.id,
            rewardName: reward.name,
            pointCost: needsPoints ? (reward.pointsCost || 0) : 0,
            discountAmount
          })

          totalDiscount += discountAmount
          finalAmount -= discountAmount
        }
      }
    }

    // Point discount (applied last, on remaining amount)
    let pointDiscount = 0
    let pointsUsed = 0

    if (selections.usePoints && selections.usePoints > 0) {
      if (selections.usePoints > customer.points) {
        errors.push(`Yetersiz puan. Mevcut: ${customer.points}, İstenen: ${selections.usePoints}`)
      } else {
        // 1 point = 0.1 TL
        const pointValue = selections.usePoints * 0.1
        pointDiscount = Math.min(pointValue, finalAmount)
        pointsUsed = Math.ceil(pointDiscount / 0.1) // Actual points to be used

        totalDiscount += pointDiscount
        finalAmount -= pointDiscount
      }
    }

    // Calculate points to earn (on final amount after all discounts)
    const basePointRate = customer.restaurant.settings?.basePointRate || 0.1
    const tierMultiplier = customer.tier?.pointMultiplier || 1.0

    // Check for loyalty point campaigns
    let loyaltyMultiplier = 1.0
    for (const campaign of appliedCampaigns) {
      const dbCampaign = await prisma.campaign.findUnique({
        where: { id: campaign.campaignId }
      })

      if (dbCampaign?.type === 'LOYALTY_POINTS') {
        loyaltyMultiplier = Math.max(loyaltyMultiplier, dbCampaign.rewardValue || 1.0)
      }
    }

    const pointsToEarn = Math.floor(finalAmount * basePointRate * tierMultiplier * loyaltyMultiplier)

    // Update campaign point earnings
    for (const campaign of appliedCampaigns) {
      const dbCampaign = await prisma.campaign.findUnique({
        where: { id: campaign.campaignId }
      })

      if (dbCampaign?.type === 'LOYALTY_POINTS') {
        campaign.pointsEarned = Math.floor(finalAmount * basePointRate * ((dbCampaign.rewardValue || 1.0) - 1))
      }
    }

    // Create reservation token
    const reservationToken = await reservationTokenService.create({
      customerId,
      items: transactionItems,
      calculations: {
        subtotal,
        totalDiscounts: totalDiscount,
        finalAmount: Math.max(0, finalAmount),
        pointsToEarn,
        pointsToUse: pointsUsed
      },
      appliedCampaigns,
      usedStamps,
      usedRewards,
      metadata: {
        tierName: customer.tier?.displayName,
        tierMultiplier,
        basePointRate
      }
    })

    // Prepare response
    const response = {
      breakdown: {
        subtotal,
        campaignDiscounts,
        pointDiscount,
        pointsUsed,
        stampProducts,
        rewardDiscounts,
        totalDiscount,
        finalAmount: Math.max(0, finalAmount)
      },
      impact: {
        pointsWillBeUsed: pointsUsed,
        pointsWillBeEarned: pointsToEarn,
        finalPointBalance: customer.points - pointsUsed + pointsToEarn,
        stampsWillBeUsed: usedStamps.length,
        remainingStamps: 0, // Will calculate if needed
        campaignUsageWillCount: appliedCampaigns.length > 0
      },
      warnings,
      errors: errors.length > 0 ? errors : undefined,
      reservationToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error previewing transaction:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}