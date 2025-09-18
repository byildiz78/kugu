import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth-utils'
import { z } from 'zod'
import { processTransactionItems } from '@/lib/utils/item-resolver'
import { reservationTokenService } from '@/lib/services/reservation-token.service'
import { rewardEvents } from '@/lib/events/reward.events'
import { queueSegmentUpdate } from '@/lib/segment-queue'
import { tierService } from '@/lib/services/tier.service'

const completeSchema = z.object({
  reservationToken: z.string(),
  orderNumber: z.string(),
  paymentMethod: z.enum(['cash', 'credit_card', 'debit_card', 'other']).optional(),
  paymentReference: z.string().optional(),
  notes: z.string().optional()
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
    const validationResult = completeSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation error',
        details: validationResult.error.flatten().fieldErrors
      }, { status: 400 })
    }

    const { reservationToken, orderNumber, paymentMethod, paymentReference, notes } = validationResult.data

    // Validate and consume reservation token
    console.log(`[Complete] Attempting to consume token: ${reservationToken}`)

    // First validate without consuming to get detailed info
    const tokenInfo = reservationTokenService.getTokenInfo(reservationToken)
    console.log(`[Complete] Token info:`, tokenInfo)

    const reservationData = await reservationTokenService.consume(reservationToken)

    if (!reservationData) {
      console.log(`[Complete] Token consumption failed for: ${reservationToken}`)
      return NextResponse.json({
        error: 'Invalid or expired token',
        message: 'Reservation token is invalid or has expired. Please create a new preview.',
        debug: tokenInfo
      }, { status: 400 })
    }

    console.log(`[Complete] Token consumed successfully for customer: ${reservationData.customerId}`)

    // Check if order number already exists
    const existingTransaction = await prisma.transaction.findUnique({
      where: { orderNumber }
    })

    if (existingTransaction) {
      return NextResponse.json({
        error: 'Duplicate order',
        message: `Order number ${orderNumber} already exists`
      }, { status: 409 })
    }

    // Get customer with current data
    const customer = await prisma.customer.findUnique({
      where: { id: reservationData.customerId },
      include: {
        tier: true,
        restaurant: true
      }
    })

    if (!customer) {
      return NextResponse.json({
        error: 'Customer not found',
        message: 'Customer no longer exists'
      }, { status: 404 })
    }

    // Check if customer has enough points
    if (reservationData.calculations.pointsToUse > customer.points) {
      return NextResponse.json({
        error: 'Insufficient points',
        message: `Customer only has ${customer.points} points, but ${reservationData.calculations.pointsToUse} points are required`
      }, { status: 400 })
    }

    // Execute transaction in database
    const transaction = await prisma.$transaction(async (tx) => {
      // 1. Create main transaction record
      const newTransaction = await tx.transaction.create({
        data: {
          orderNumber,
          customerId: reservationData.customerId,
          totalAmount: reservationData.calculations.subtotal,
          discountAmount: reservationData.calculations.totalDiscounts,
          finalAmount: reservationData.calculations.finalAmount,
          pointsEarned: reservationData.calculations.pointsToEarn,
          pointsUsed: reservationData.calculations.pointsToUse,
          paymentMethod: paymentMethod || 'cash',
          status: 'COMPLETED',
          tierId: customer.tier?.id,
          tierMultiplier: reservationData.metadata?.tierMultiplier || 1.0,
          notes: notes || null,
          transactionDate: new Date(),

          // Add items
          items: {
            create: reservationData.items.map(item => ({
              productId: item.productId,
              productName: item.productName,
              menuItemKey: item.menuItemKey || null,
              category: item.category,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              discountAmount: item.discountAmount || 0,
              isFree: item.isFree || false,
              notes: null
            }))
          },

          // Add applied campaigns
          appliedCampaigns: {
            create: reservationData.appliedCampaigns.map(campaign => ({
              campaignId: campaign.campaignId,
              discountAmount: campaign.discountAmount,
              pointsEarned: campaign.pointsEarned || 0,
              freeItems: campaign.freeItems ? JSON.stringify(campaign.freeItems) : null
            }))
          }
        },
        include: {
          items: true,
          appliedCampaigns: {
            include: {
              campaign: true
            }
          }
        }
      })

      // 2. Record campaign usages
      for (const campaign of reservationData.appliedCampaigns) {
        await tx.campaignUsage.create({
          data: {
            customerId: reservationData.customerId,
            campaignId: campaign.campaignId,
            orderAmount: reservationData.calculations.subtotal,
            discountAmount: campaign.discountAmount,
            usedAt: new Date()
          }
        })
      }

      // 3. Record stamp redemptions
      for (const stamp of reservationData.usedStamps) {
        // Record in CampaignUsage for reporting
        await tx.campaignUsage.create({
          data: {
            customerId: reservationData.customerId,
            campaignId: stamp.campaignId,
            orderAmount: reservationData.calculations.subtotal,
            discountAmount: stamp.value, // Value of the free product
            usedAt: new Date()
          }
        })

        // Record in TransactionCampaign for stamp counting
        await tx.transactionCampaign.create({
          data: {
            transactionId: newTransaction.id,
            campaignId: stamp.campaignId,
            discountAmount: stamp.value,
            pointsEarned: 0,
            freeItems: JSON.stringify([{
              productName: stamp.productName,
              quantity: stamp.quantity,
              value: stamp.value
            }])
          }
        })
      }

      // 4. Process reward redemptions
      for (const reward of reservationData.usedRewards) {
        // Check if customer has the reward
        const customerReward = await tx.customerReward.findFirst({
          where: {
            customerId: reservationData.customerId,
            rewardId: reward.rewardId,
            isRedeemed: false
          }
        })

        if (customerReward) {
          // Mark as redeemed
          await tx.customerReward.update({
            where: { id: customerReward.id },
            data: {
              isRedeemed: true,
              redeemedAt: new Date(),
              metadata: JSON.stringify({
                transactionId: newTransaction.id,
                orderNumber
              })
            }
          })
        } else if (reward.pointCost > 0) {
          // Create and immediately redeem if purchased with points
          await tx.customerReward.create({
            data: {
              customerId: reservationData.customerId,
              rewardId: reward.rewardId,
              isRedeemed: true,
              redeemedAt: new Date(),
              metadata: JSON.stringify({
                purchasedWithPoints: true,
                pointCost: reward.pointCost,
                transactionId: newTransaction.id,
                orderNumber
              })
            }
          })
        }
      }

      // 5. Update customer points
      const newPointBalance = customer.points - reservationData.calculations.pointsToUse + reservationData.calculations.pointsToEarn

      await tx.customer.update({
        where: { id: reservationData.customerId },
        data: {
          points: newPointBalance,
          totalSpent: {
            increment: reservationData.calculations.finalAmount
          },
          visitCount: {
            increment: reservationData.calculations.finalAmount > 0 ? 1 : 0
          },
          lastVisit: new Date()
        }
      })

      // 6. Record point history
      if (reservationData.calculations.pointsToUse > 0) {
        await tx.pointHistory.create({
          data: {
            customerId: reservationData.customerId,
            amount: -reservationData.calculations.pointsToUse,
            type: 'SPENT',
            source: 'PURCHASE',
            sourceId: newTransaction.id,
            balance: customer.points - reservationData.calculations.pointsToUse,
            description: `${orderNumber} siparişinde kullanıldı`
          }
        })
      }

      if (reservationData.calculations.pointsToEarn > 0) {
        await tx.pointHistory.create({
          data: {
            customerId: reservationData.customerId,
            amount: reservationData.calculations.pointsToEarn,
            type: 'EARNED',
            source: 'PURCHASE',
            sourceId: newTransaction.id,
            balance: newPointBalance,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
            description: `${orderNumber} siparişinden kazanıldı`
          }
        })
      }

      return newTransaction
    })

    // Emit events for additional processing
    if (reservationData.calculations.pointsToEarn > 0) {
      rewardEvents.emitPointsEarned(
        reservationData.customerId,
        reservationData.calculations.pointsToEarn,
        'PURCHASE',
        transaction.id
      )
    }

    if (reservationData.calculations.pointsToUse > 0) {
      rewardEvents.emitPointsSpent(
        reservationData.customerId,
        reservationData.calculations.pointsToUse,
        'PURCHASE',
        transaction.id
      )
    }

    // Emit transaction completed event
    rewardEvents.emitTransactionCompleted(
      transaction.id,
      reservationData.customerId,
      reservationData.calculations.finalAmount
    )

    // Check for milestone achievements
    const updatedCustomer = await prisma.customer.findUnique({
      where: { id: reservationData.customerId }
    })

    const achievements: any[] = []

    // Check milestones
    const milestones = [
      { type: 'TOTAL_SPENT', values: [100, 500, 1000, 2500, 5000] },
      { type: 'VISIT_COUNT', values: [5, 10, 25, 50, 100] },
      { type: 'POINTS_MILESTONE', values: [100, 500, 1000, 2500, 5000] }
    ]

    for (const milestone of milestones) {
      for (const value of milestone.values) {
        const previousValue = milestone.type === 'TOTAL_SPENT'
          ? updatedCustomer!.totalSpent - reservationData.calculations.finalAmount
          : milestone.type === 'VISIT_COUNT'
          ? updatedCustomer!.visitCount - 1
          : customer.points

        const currentValue = milestone.type === 'TOTAL_SPENT'
          ? updatedCustomer!.totalSpent
          : milestone.type === 'VISIT_COUNT'
          ? updatedCustomer!.visitCount
          : updatedCustomer!.points

        if (previousValue < value && currentValue >= value) {
          rewardEvents.emitMilestoneReached(
            reservationData.customerId,
            milestone.type,
            value
          )

          achievements.push({
            type: 'MILESTONE',
            message: `${milestone.type === 'TOTAL_SPENT' ? 'Toplam harcama' : milestone.type === 'VISIT_COUNT' ? 'Ziyaret sayısı' : 'Puan'} ${value} seviyesine ulaştınız!`
          })
        }
      }
    }

    // Check for tier upgrade
    try {
      const upgradedTier = await tierService.checkAndUpgradeTier(
        reservationData.customerId,
        'TRANSACTION_COMPLETED'
      )

      if (upgradedTier) {
        achievements.push({
          type: 'TIER_UPGRADE',
          message: `Tebrikler! ${upgradedTier.displayName} seviyesine yükseldiniz!`,
          reward: `${upgradedTier.pointMultiplier}x puan kazanımı`
        })
      }
    } catch (error) {
      console.error('Error checking tier upgrade:', error)
    }

    // Queue segment update
    queueSegmentUpdate(reservationData.customerId)

    // Prepare response
    const response = {
      success: true,
      transactionId: transaction.id,
      orderNumber: transaction.orderNumber,
      summary: {
        totalAmount: reservationData.calculations.subtotal,
        discountAmount: reservationData.calculations.totalDiscounts,
        finalAmount: reservationData.calculations.finalAmount,
        pointsEarned: reservationData.calculations.pointsToEarn,
        pointsUsed: reservationData.calculations.pointsToUse,
        newPointBalance: updatedCustomer!.points,
        stampsUsed: reservationData.usedStamps.length,
        campaignsApplied: reservationData.appliedCampaigns.map(c => c.campaignName),
        rewardsRedeemed: reservationData.usedRewards.map(r => r.rewardName)
      },
      achievements: achievements.length > 0 ? achievements : undefined,
      receipt: {
        items: reservationData.items.map(item => ({
          productId: item.productId,
          name: item.productName,
          menuItemKey: item.menuItemKey || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          isFree: item.isFree
        })),
        discounts: [
          ...reservationData.appliedCampaigns.filter(c => c.discountAmount > 0).map(c => ({
            type: 'campaign',
            name: c.campaignName,
            amount: c.discountAmount
          })),
          ...reservationData.usedStamps.map(s => ({
            type: 'stamp',
            name: `Damga: ${s.productName}`,
            amount: s.value
          })),
          ...reservationData.usedRewards.filter(r => r.discountAmount).map(r => ({
            type: 'reward',
            name: r.rewardName,
            amount: r.discountAmount || 0
          })),
          ...(reservationData.calculations.pointsToUse > 0 ? [{
            type: 'points',
            name: `Puan Kullanımı (${reservationData.calculations.pointsToUse} puan)`,
            amount: reservationData.calculations.pointsToUse * 0.1
          }] : [])
        ],
        payment: {
          method: paymentMethod || 'cash',
          reference: paymentReference,
          amount: reservationData.calculations.finalAmount
        }
      }
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Error completing transaction:', error)

    // If it's a Prisma error
    if ((error as any)?.code === 'P2002') {
      return NextResponse.json({
        error: 'Duplicate transaction',
        message: 'This order has already been processed'
      }, { status: 409 })
    }

    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}