import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth-utils'
import { z } from 'zod'
import { TransactionCancelService } from '@/lib/services/transaction-cancel.service'

const cancelSchema = z.object({
  orderNumber: z.string().optional(),
  transactionId: z.string().optional(),
  reason: z.string().optional(),
  refundPoints: z.boolean().default(true),
  cancelCampaignUsage: z.boolean().default(true),
  cancelStamps: z.boolean().default(true),
  cancelRewards: z.boolean().default(true),
  checkTierDowngrade: z.boolean().default(true)
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

    const {
      orderNumber,
      transactionId,
      reason,
      refundPoints,
      cancelCampaignUsage,
      cancelStamps,
      cancelRewards,
      checkTierDowngrade
    } = validationResult.data

    // Initialize the cancellation service
    const cancelService = new TransactionCancelService()

    try {
      // Find the transaction ID if only orderNumber is provided
      let txId = transactionId
      if (!txId && orderNumber) {
        const tx = await prisma.transaction.findFirst({
          where: { orderNumber },
          select: { id: true }
        })
        if (!tx) {
          return NextResponse.json({
            error: 'Transaction not found',
            message: `No transaction found with order number: ${orderNumber}`
          }, { status: 404 })
        }
        txId = tx.id
      }

      if (!txId) {
        return NextResponse.json({
          error: 'Transaction not found',
          message: 'Unable to identify transaction'
        }, { status: 404 })
      }

      // Cancel the transaction using the service
      const results = await cancelService.cancelTransaction(prisma, txId, {
        refundPoints,
        cancelCampaignUsage,
        cancelStamps,
        cancelRewards,
        checkTierDowngrade,
        reason
      })

      return NextResponse.json({
        success: true,
        message: `Transaction ${results.transaction.orderNumber} has been cancelled successfully`,
        results: {
          transaction: results.transaction,
          pointsRefunded: results.pointsRefunded,
          pointsRevoked: results.pointsRevoked,
          campaignUsagesCancelled: results.campaignUsagesCancelled,
          stampsRevoked: results.stampsRevoked,
          rewardsRevoked: results.rewardsRevoked,
          tierDowngraded: results.tierDowngraded,
          errors: results.errors
        }
      })
    } catch (serviceError) {
      // Handle specific service errors
      if (serviceError instanceof Error) {
        if (serviceError.message.includes('not found')) {
          return NextResponse.json({
            error: 'Transaction not found',
            message: serviceError.message
          }, { status: 404 })
        }
        if (serviceError.message.includes('already')) {
          return NextResponse.json({
            error: 'Transaction already cancelled',
            message: serviceError.message
          }, { status: 400 })
        }
      }
      throw serviceError // Re-throw for general error handler
    }

  } catch (error) {
    console.error('Error cancelling transaction:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}