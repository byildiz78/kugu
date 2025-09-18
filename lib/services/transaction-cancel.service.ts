import { PrismaClient, Prisma, Transaction, TransactionCampaign, Customer } from '@prisma/client'

interface CancelTransactionOptions {
  refundPoints?: boolean
  cancelCampaignUsage?: boolean
  cancelStamps?: boolean
  cancelRewards?: boolean
  checkTierDowngrade?: boolean
  reason?: string
}

interface CancellationResult {
  transaction: Transaction
  pointsRefunded: number
  pointsRevoked: number
  campaignUsagesCancelled: any[]
  stampsRevoked: number
  rewardsRevoked: string[]
  tierDowngraded: boolean
  errors: string[]
}

type TransactionWithRelations = Transaction & {
  customer: Customer
  appliedCampaigns: (TransactionCampaign & {
    campaign: any
  })[]
  items: any[]
}

export class TransactionCancelService {

  private async cancelPoints(
    tx: Prisma.TransactionClient,
    transaction: TransactionWithRelations,
    results: CancellationResult
  ): Promise<void> {
    // Refund used points
    if (transaction.pointsUsed > 0) {
      const currentCustomer = await tx.customer.findUnique({
        where: { id: transaction.customerId }
      })

      if (!currentCustomer) throw new Error('Customer not found')

      await tx.pointHistory.create({
        data: {
          customerId: transaction.customerId,
          amount: transaction.pointsUsed,
          type: 'ADJUSTED',
          source: 'REFUND',
          sourceId: transaction.id,
          balance: currentCustomer.points + transaction.pointsUsed,
          description: `İade: ${transaction.orderNumber} siparişinde kullanılan ${transaction.pointsUsed} puan iade edildi`
        }
      })

      await tx.customer.update({
        where: { id: transaction.customerId },
        data: {
          points: { increment: transaction.pointsUsed }
        }
      })

      results.pointsRefunded = transaction.pointsUsed
    }

    // Revoke earned points from transaction
    const settings = await tx.settings.findFirst()
    const basePointRate = settings?.basePointRate || 0.1
    const pointsToRevoke = Math.floor(transaction.finalAmount * basePointRate)

    if (pointsToRevoke > 0) {
      const currentCustomer = await tx.customer.findUnique({
        where: { id: transaction.customerId }
      })

      if (!currentCustomer) throw new Error('Customer not found')

      await tx.pointHistory.create({
        data: {
          customerId: transaction.customerId,
          amount: -pointsToRevoke,
          type: 'ADJUSTED',
          source: 'CANCELLATION',
          sourceId: transaction.id,
          balance: Math.max(0, currentCustomer.points - pointsToRevoke),
          description: `İptal: ${transaction.orderNumber} siparişinden kazanılan ${pointsToRevoke} puan geri alındı`
        }
      })

      await tx.customer.update({
        where: { id: transaction.customerId },
        data: {
          points: {
            decrement: Math.min(currentCustomer.points, pointsToRevoke)
          }
        }
      })

      results.pointsRevoked = pointsToRevoke
    }
  }

  private async cancelCampaigns(
    tx: Prisma.TransactionClient,
    transaction: TransactionWithRelations,
    results: CancellationResult
  ): Promise<void> {
    if (transaction.appliedCampaigns.length === 0) return

    for (const appliedCampaign of transaction.appliedCampaigns) {
      // Delete campaign usage records
      const campaignUsages = await tx.campaignUsage.findMany({
        where: {
          customerId: transaction.customerId,
          campaignId: appliedCampaign.campaignId,
          usedAt: {
            gte: new Date(transaction.transactionDate.getTime() - 60000),
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

      // Revoke campaign bonus points
      if (appliedCampaign.pointsEarned > 0) {
        const currentCustomer = await tx.customer.findUnique({
          where: { id: transaction.customerId }
        })

        if (!currentCustomer) throw new Error('Customer not found')

        await tx.pointHistory.create({
          data: {
            customerId: transaction.customerId,
            amount: -appliedCampaign.pointsEarned,
            type: 'ADJUSTED',
            source: 'CAMPAIGN_CANCELLATION',
            sourceId: appliedCampaign.id,
            balance: Math.max(0, currentCustomer.points - appliedCampaign.pointsEarned),
            description: `İptal: ${appliedCampaign.campaign.name} kampanyasından kazanılan ${appliedCampaign.pointsEarned} puan geri alındı`
          }
        })

        await tx.customer.update({
          where: { id: transaction.customerId },
          data: {
            points: {
              decrement: Math.min(currentCustomer.points, appliedCampaign.pointsEarned)
            }
          }
        })
      }

      // Delete TransactionCampaign records
      await tx.transactionCampaign.delete({
        where: { id: appliedCampaign.id }
      })
    }
  }

  private async cancelStamps(
    tx: Prisma.TransactionClient,
    transaction: TransactionWithRelations,
    results: CancellationResult
  ): Promise<void> {
    // Find PRODUCT_BASED campaigns that were applied
    const productBasedCampaigns = transaction.appliedCampaigns.filter(
      ac => ac.campaign.type === 'PRODUCT_BASED'
    )

    if (productBasedCampaigns.length === 0) return

    let totalStampsRevoked = 0

    for (const campaignUsage of productBasedCampaigns) {
      const campaign = campaignUsage.campaign

      // Calculate stamps earned from this transaction
      const relevantItems = transaction.items.filter(item => {
        if (!campaign.conditions?.productIds) return false
        return campaign.conditions.productIds.includes(item.productId)
      })

      if (relevantItems.length === 0) continue

      const totalQuantity = relevantItems.reduce((sum, item) => sum + item.quantity, 0)
      const buyQuantity = campaign.conditions?.buyQuantity || 1
      const stampsEarned = Math.floor(totalQuantity / buyQuantity)

      if (stampsEarned > 0) {
        totalStampsRevoked += stampsEarned

        // Log stamp revocation (stamps are tracked through TransactionCampaign which we already deleted)
        await tx.campaignUsage.create({
          data: {
            customerId: transaction.customerId,
            campaignId: campaign.id,
            usedAt: new Date(),
            metadata: JSON.stringify({
              type: 'STAMP_REVOCATION',
              transactionId: transaction.id,
              stampsRevoked: stampsEarned,
              reason: 'Transaction cancelled'
            })
          }
        })
      }
    }

    results.stampsRevoked = totalStampsRevoked
  }

  private async cancelRewards(
    tx: Prisma.TransactionClient,
    transaction: TransactionWithRelations,
    results: CancellationResult
  ): Promise<void> {
    // Find rewards earned from this transaction
    const customerRewards = await tx.customerReward.findMany({
      where: {
        customerId: transaction.customerId,
        metadata: {
          contains: transaction.id
        },
        createdAt: {
          gte: new Date(transaction.transactionDate.getTime() - 300000), // Within 5 minutes
          lte: new Date(transaction.transactionDate.getTime() + 300000)
        }
      },
      include: {
        reward: true
      }
    })

    for (const customerReward of customerRewards) {
      // Only delete if not already redeemed
      if (!customerReward.isRedeemed) {
        await tx.customerReward.delete({
          where: { id: customerReward.id }
        })

        results.rewardsRevoked.push(customerReward.reward.name)
      } else {
        results.errors.push(
          `Ödül kullanılmış ve iptal edilemedi: ${customerReward.reward.name}`
        )
      }
    }

    // Check for milestone-based rewards that may need to be revoked
    const customer = await tx.customer.findUnique({
      where: { id: transaction.customerId }
    })

    if (!customer) return

    // Check if customer will drop below milestone thresholds after cancellation
    const newTotalSpent = customer.totalSpent - transaction.finalAmount
    const newVisitCount = customer.visitCount - 1

    // Find milestone rewards that should be revoked
    const rewardRules = await tx.rewardRule.findMany({
      where: {
        isActive: true,
        OR: [
          {
            triggerType: 'TOTAL_SPENT',
            triggerValue: { gt: newTotalSpent }
          },
          {
            triggerType: 'VISIT_COUNT',
            triggerValue: { gt: newVisitCount }
          }
        ]
      }
    })

    for (const rule of rewardRules) {
      // Check if customer has this milestone reward
      const milestoneReward = await tx.customerReward.findFirst({
        where: {
          customerId: transaction.customerId,
          rewardId: rule.rewardId,
          isRedeemed: false,
          metadata: {
            contains: `"ruleId":"${rule.id}"`
          }
        },
        include: {
          reward: true
        }
      })

      if (milestoneReward) {
        await tx.customerReward.delete({
          where: { id: milestoneReward.id }
        })

        results.rewardsRevoked.push(`Milestone: ${milestoneReward.reward.name}`)
      }
    }
  }

  private async checkTierDowngrade(
    tx: Prisma.TransactionClient,
    transaction: TransactionWithRelations,
    results: CancellationResult
  ): Promise<void> {
    const customer = await tx.customer.findUnique({
      where: { id: transaction.customerId },
      include: {
        tier: true
      }
    })

    if (!customer || !customer.tier) return

    // Calculate new metrics after cancellation
    const newTotalSpent = customer.totalSpent - transaction.finalAmount
    const newVisitCount = customer.visitCount - 1

    // Find appropriate tier based on new metrics
    const appropriateTier = await tx.tier.findFirst({
      where: {
        minSpent: { lte: newTotalSpent },
        minVisits: { lte: newVisitCount },
        isActive: true
      },
      orderBy: {
        minSpent: 'desc'
      }
    })

    // If customer should be downgraded
    if (appropriateTier && appropriateTier.id !== customer.tierId) {
      await tx.customer.update({
        where: { id: transaction.customerId },
        data: {
          tierId: appropriateTier.id
        }
      })

      // Log tier change
      await tx.tierHistory.create({
        data: {
          customerId: transaction.customerId,
          fromTierId: customer.tierId,
          toTierId: appropriateTier.id,
          reason: `İşlem iptali: ${transaction.orderNumber}`,
          triggeredBy: 'SYSTEM'
        }
      })

      results.tierDowngraded = true
    }
  }

  async cancelTransaction(
    prisma: PrismaClient,
    transactionId: string,
    options: CancelTransactionOptions = {}
  ): Promise<CancellationResult> {
    const {
      refundPoints = true,
      cancelCampaignUsage = true,
      cancelStamps = true,
      cancelRewards = true,
      checkTierDowngrade = true,
      reason = 'No reason provided'
    } = options

    // Find transaction with all relations
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId },
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
      throw new Error(`Transaction not found: ${transactionId}`)
    }

    if (transaction.status === 'CANCELLED' || transaction.status === 'REFUNDED') {
      throw new Error(`Transaction already ${transaction.status.toLowerCase()}`)
    }

    const results: CancellationResult = {
      transaction: null as any,
      pointsRefunded: 0,
      pointsRevoked: 0,
      campaignUsagesCancelled: [],
      stampsRevoked: 0,
      rewardsRevoked: [],
      tierDowngraded: false,
      errors: []
    }

    // Execute all cancellations in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update transaction status
      results.transaction = await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'CANCELLED',
          notes: `${transaction.notes || ''}\n[CANCELLED] ${new Date().toISOString()}: ${reason}`
        }
      })

      // 2. Cancel points
      if (refundPoints) {
        await this.cancelPoints(tx, transaction as TransactionWithRelations, results)
      }

      // 3. Cancel campaigns and stamps
      if (cancelCampaignUsage) {
        await this.cancelCampaigns(tx, transaction as TransactionWithRelations, results)
      }

      // 4. Cancel stamps specifically
      if (cancelStamps) {
        await this.cancelStamps(tx, transaction as TransactionWithRelations, results)
      }

      // 5. Cancel rewards
      if (cancelRewards) {
        await this.cancelRewards(tx, transaction as TransactionWithRelations, results)
      }

      // 6. Update customer statistics
      await tx.customer.update({
        where: { id: transaction.customerId },
        data: {
          totalSpent: {
            decrement: Math.min(transaction.customer.totalSpent, transaction.finalAmount)
          },
          visitCount: {
            decrement: Math.min(transaction.customer.visitCount, 1)
          }
        }
      })

      // 7. Check for tier downgrade
      if (checkTierDowngrade) {
        await this.checkTierDowngrade(tx, transaction as TransactionWithRelations, results)
      }
    }, {
      maxWait: 10000,
      timeout: 30000
    })

    return results
  }
}