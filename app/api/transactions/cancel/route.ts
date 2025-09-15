import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth-utils'
import { z } from 'zod'

const cancelSchema = z.object({
  orderNumber: z.string().optional(),
  transactionId: z.string().optional(),
  reason: z.string().optional(),
  refundPoints: z.boolean().default(true),
  cancelCampaignUsage: z.boolean().default(true)
}).refine(data => data.orderNumber || data.transactionId, {
  message: 'Either orderNumber or transactionId is required'
})

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
    
    // Validate request body
    const validationResult = cancelSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: validationResult.error.flatten().fieldErrors 
      }, { status: 400 })
    }

    const { orderNumber, transactionId, reason, refundPoints, cancelCampaignUsage } = validationResult.data

    // Find the original transaction
    const transaction = await prisma.transaction.findFirst({
      where: transactionId ? { id: transactionId } : { orderNumber: orderNumber! },
      include: {
        customer: true,
        appliedCampaigns: {
          include: {
            campaign: true
          }
        },
        items: true
      }
    })

    if (!transaction) {
      return NextResponse.json({ 
        error: 'Transaction not found',
        message: transactionId 
          ? `No transaction found with ID: ${transactionId}`
          : `No transaction found with order number: ${orderNumber}`
      }, { status: 404 })
    }

    // Check if already cancelled
    if (transaction.status === 'CANCELLED' || transaction.status === 'REFUNDED') {
      return NextResponse.json({ 
        error: 'Transaction already cancelled',
        message: `Transaction ${orderNumber} is already ${transaction.status.toLowerCase()}`
      }, { status: 400 })
    }

    const results = {
      transaction: null as any,
      pointsRefunded: 0,
      pointsRevoked: 0,
      campaignUsagesCancelled: [] as any[],
      errors: [] as string[]
    }

    // Start transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update transaction status
      results.transaction = await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'CANCELLED',
          notes: `${transaction.notes || ''}\n[CANCELLED] ${new Date().toISOString()}: ${reason || 'No reason provided'}`
        }
      })

      // 2. Handle points
      if (refundPoints) {
        // Refund used points
        if (transaction.pointsUsed > 0) {
          await tx.pointHistory.create({
            data: {
              customerId: transaction.customerId,
              amount: transaction.pointsUsed,
              type: 'ADJUSTED',
              source: 'REFUND',
              sourceId: transaction.id,
              balance: transaction.customer.points + transaction.pointsUsed,
              description: `İade: ${orderNumber} siparişinde kullanılan ${transaction.pointsUsed} puan iade edildi`
            }
          })

          await tx.customer.update({
            where: { id: transaction.customerId },
            data: {
              points: {
                increment: transaction.pointsUsed
              }
            }
          })

          results.pointsRefunded = transaction.pointsUsed
        }

        // Revoke earned points (calculate from transaction amount)
        const pointsToRevoke = Math.floor(transaction.finalAmount / 10) // Assuming 1 point per 10 TL
        if (pointsToRevoke > 0) {
          await tx.pointHistory.create({
            data: {
              customerId: transaction.customerId,
              amount: -pointsToRevoke,
              type: 'ADJUSTED',
              source: 'CANCELLATION',
              sourceId: transaction.id,
              balance: transaction.customer.points - pointsToRevoke,
              description: `İptal: ${orderNumber} siparişinden kazanılan ${pointsToRevoke} puan geri alındı`
            }
          })

          await tx.customer.update({
            where: { id: transaction.customerId },
            data: {
              points: {
                decrement: pointsToRevoke
              }
            }
          })

          results.pointsRevoked = pointsToRevoke
        }
      }

      // 3. Cancel campaign usages
      if (cancelCampaignUsage && transaction.appliedCampaigns.length > 0) {
        for (const appliedCampaign of transaction.appliedCampaigns) {
          // Find and delete campaign usage records
          const campaignUsages = await tx.campaignUsage.findMany({
            where: {
              customerId: transaction.customerId,
              campaignId: appliedCampaign.campaignId,
              usedAt: {
                gte: new Date(transaction.transactionDate.getTime() - 60000), // Within 1 minute of transaction
                lte: new Date(transaction.transactionDate.getTime() + 60000)
              }
            }
          })

          for (const usage of campaignUsages) {
            await tx.campaignUsage.delete({
              where: { id: usage.id }
            })
            results.campaignUsagesCancelled.push({
              campaignId: usage.campaignId,
              campaignName: appliedCampaign.campaign.name,
              usageId: usage.id
            })
          }

          // If campaign had free items or special rewards, handle them
          if (appliedCampaign.pointsEarned > 0) {
            await tx.pointHistory.create({
              data: {
                customerId: transaction.customerId,
                amount: -appliedCampaign.pointsEarned,
                type: 'ADJUSTED',
                source: 'CAMPAIGN_CANCELLATION',
                sourceId: appliedCampaign.id,
                balance: transaction.customer.points - appliedCampaign.pointsEarned,
                description: `İptal: ${appliedCampaign.campaign.name} kampanyasından kazanılan ${appliedCampaign.pointsEarned} puan geri alındı`
              }
            })

            await tx.customer.update({
              where: { id: transaction.customerId },
              data: {
                points: {
                  decrement: appliedCampaign.pointsEarned
                }
              }
            })
          }
        }
      }

      // 4. Update customer statistics
      await tx.customer.update({
        where: { id: transaction.customerId },
        data: {
          totalSpent: {
            decrement: transaction.finalAmount
          },
          visitCount: {
            decrement: 1
          }
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: `Transaction ${orderNumber} has been cancelled successfully`,
      results
    })

  } catch (error) {
    console.error('Error cancelling transaction:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}