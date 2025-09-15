import { prisma } from '@/lib/prisma'
import { Customer, CustomerLevel, Reward, RewardType, TriggerType, PointTransactionType } from '@prisma/client'
import { addDays } from 'date-fns'

interface AssignRewardOptions {
  source: string
  reason?: string
  campaignId?: string
  transactionId?: string
}

interface EligibilityResult {
  success: boolean
  reason?: string
}

export class RewardService {
  // Process rewards after a transaction
  async processTransactionRewards(transactionId: string) {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          customer: true,
          appliedCampaigns: {
            include: {
              campaign: {
                include: {
                  campaignRewards: {
                    include: {
                      reward: true
                    }
                  }
                }
              }
            }
          }
        }
      })

      if (!transaction) {
        throw new Error('Transaction not found')
      }

      // 1. Process campaign rewards
      for (const appliedCampaign of transaction.appliedCampaigns) {
        const campaign = appliedCampaign.campaign
        
        if (campaign.autoGiveReward && campaign.campaignRewards.length > 0) {
          // Sort by priority and assign rewards
          const sortedRewards = campaign.campaignRewards.sort((a, b) => b.priority - a.priority)
          
          for (const campaignReward of sortedRewards) {
            if (campaignReward.reward.isActive) {
              await this.assignReward(
                transaction.customerId,
                campaignReward.rewardId,
                {
                  source: 'CAMPAIGN',
                  reason: `Campaign: ${campaign.name}`,
                  campaignId: campaign.id,
                  transactionId: transaction.id
                }
              )
            }
          }
        }
      }

      // 2. Check milestone rewards
      await this.checkMilestoneRewards(transaction.customerId)

      // 3. Check tier-based rewards
      await this.checkTierRewards(transaction.customerId)

    } catch (error) {
      console.error('Error processing transaction rewards:', error)
      throw error
    }
  }

  // Check and assign milestone rewards
  async checkMilestoneRewards(customerId: string) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    })

    if (!customer) return

    // Get all active milestone rules
    const milestoneRules = await prisma.rewardRule.findMany({
      where: {
        reward: {
          isActive: true,
          type: RewardType.MILESTONE
        },
        isActive: true,
        triggerType: {
          in: [TriggerType.VISIT_COUNT, TriggerType.TOTAL_SPENT, TriggerType.POINTS_MILESTONE]
        }
      },
      include: {
        reward: true
      }
    })

    for (const rule of milestoneRules) {
      let shouldAssign = false
      let reason = ''

      switch (rule.triggerType) {
        case TriggerType.VISIT_COUNT:
          if (customer.visitCount === rule.triggerValue) {
            shouldAssign = true
            reason = `${rule.triggerValue}. ziyaret ödülü`
          }
          break

        case TriggerType.TOTAL_SPENT:
          if (customer.totalSpent >= rule.triggerValue && 
              customer.totalSpent - rule.triggerValue < 100) { // First time crossing threshold
            shouldAssign = true
            reason = `${rule.triggerValue}₺ harcama ödülü`
          }
          break

        case TriggerType.POINTS_MILESTONE:
          if (customer.points >= rule.triggerValue) {
            // Check if already given
            const existingReward = await prisma.customerReward.findFirst({
              where: {
                customerId,
                rewardId: rule.rewardId,
                metadata: {
                  contains: `"milestone":${rule.triggerValue}`
                }
              }
            })
            if (!existingReward) {
              shouldAssign = true
              reason = `${rule.triggerValue} puan ödülü`
            }
          }
          break
      }

      if (shouldAssign) {
        await this.assignReward(customerId, rule.rewardId, {
          source: 'MILESTONE',
          reason
        })
      }
    }
  }

  // Check tier-based rewards
  async checkTierRewards(customerId: string) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    })

    if (!customer) return

    // Get tier-based rewards
    const tierRewards = await prisma.rewardRule.findMany({
      where: {
        reward: {
          isActive: true,
          type: RewardType.TIER_BASED
        },
        isActive: true,
        triggerType: TriggerType.TIER_REACHED
      },
      include: {
        reward: true
      }
    })

    for (const rule of tierRewards) {
      // Check if customer reached the tier
      const tierLevels = ['REGULAR', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM']
      const customerTierIndex = tierLevels.indexOf(customer.level)
      const requiredTierIndex = rule.triggerValue

      if (customerTierIndex >= requiredTierIndex) {
        // Check if already given for this tier
        const existingReward = await prisma.customerReward.findFirst({
          where: {
            customerId,
            rewardId: rule.rewardId,
            metadata: {
              contains: `"tier":"${customer.level}"`
            }
          }
        })

        if (!existingReward) {
          await this.assignReward(customerId, rule.rewardId, {
            source: 'TIER_UPGRADE',
            reason: `${customer.level} seviye ödülü`
          })
        }
      }
    }
  }

  // Assign a reward to a customer
  async assignReward(customerId: string, rewardId: string, options: AssignRewardOptions) {
    try {
      // Check eligibility
      const eligibility = await this.checkEligibility(customerId, rewardId)
      if (!eligibility.success) {
        console.log(`Reward assignment failed: ${eligibility.reason}`)
        return null
      }

      const reward = await prisma.reward.findUnique({
        where: { id: rewardId }
      })

      if (!reward) {
        throw new Error('Reward not found')
      }

      // Calculate expiration date
      let expiresAt = null
      if (reward.validityDays) {
        expiresAt = addDays(new Date(), reward.validityDays)
      }

      // Create metadata
      const metadata = {
        source: options.source,
        reason: options.reason,
        campaignId: options.campaignId,
        transactionId: options.transactionId,
        assignedAt: new Date().toISOString()
      }

      // Assign the reward
      const customerReward = await prisma.customerReward.create({
        data: {
          customerId,
          rewardId,
          expiresAt,
          metadata: JSON.stringify(metadata)
        }
      })

      // TODO: Send notification
      // await notificationService.sendRewardNotification(customerId, reward)

      return customerReward
    } catch (error) {
      console.error('Error assigning reward:', error)
      throw error
    }
  }

  // Check if customer is eligible for a reward
  async checkEligibility(customerId: string, rewardId: string): Promise<EligibilityResult> {
    try {
      const [customer, reward] = await Promise.all([
        prisma.customer.findUnique({ where: { id: customerId } }),
        prisma.reward.findUnique({ where: { id: rewardId } })
      ])

      if (!customer || !reward) {
        return { success: false, reason: 'Customer or reward not found' }
      }

      // Check if reward is active
      if (!reward.isActive) {
        return { success: false, reason: 'Reward is not active' }
      }

      // Check tier requirement
      if (reward.minTier) {
        const tierLevels = ['REGULAR', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM']
        const customerTierIndex = tierLevels.indexOf(customer.level)
        const requiredTierIndex = tierLevels.indexOf(reward.minTier)
        
        if (customerTierIndex < requiredTierIndex) {
          return { success: false, reason: `Minimum ${reward.minTier} tier required` }
        }
      }

      // Check stock availability
      if (reward.stockCount !== null && reward.stockCount <= 0) {
        return { success: false, reason: 'Reward out of stock' }
      }

      // Check max redemptions
      if (reward.maxRedemptions) {
        const totalRedemptions = await prisma.customerReward.count({
          where: { rewardId }
        })
        if (totalRedemptions >= reward.maxRedemptions) {
          return { success: false, reason: 'Maximum redemptions reached' }
        }
      }

      // Check per customer limit
      if (reward.maxPerCustomer) {
        const customerRedemptions = await prisma.customerReward.count({
          where: { customerId, rewardId }
        })
        if (customerRedemptions >= reward.maxPerCustomer) {
          return { success: false, reason: 'Customer limit reached' }
        }
      }

      // Check custom conditions if any
      if (reward.conditions) {
        const conditions = JSON.parse(reward.conditions)
        // TODO: Implement custom condition checking
      }

      return { success: true }
    } catch (error) {
      console.error('Error checking eligibility:', error)
      return { success: false, reason: 'Error checking eligibility' }
    }
  }

  // Record points transaction
  async recordPointsTransaction(
    customerId: string,
    amount: number,
    type: PointTransactionType,
    source: string,
    sourceId?: string,
    description?: string,
    expiresIn?: number // Days until expiration
  ) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId }
      })

      if (!customer) {
        throw new Error('Customer not found')
      }

      const newBalance = customer.points + amount
      if (newBalance < 0) {
        throw new Error('Insufficient points')
      }

      // Update customer points
      await prisma.customer.update({
        where: { id: customerId },
        data: { points: newBalance }
      })

      // Calculate expiration date
      let expiresAt = null
      if (expiresIn && type === PointTransactionType.EARNED) {
        expiresAt = addDays(new Date(), expiresIn)
      }

      // Record transaction
      const pointHistory = await prisma.pointHistory.create({
        data: {
          customerId,
          amount,
          type,
          source,
          sourceId,
          balance: newBalance,
          expiresAt,
          description
        }
      })

      return pointHistory
    } catch (error) {
      console.error('Error recording points transaction:', error)
      throw error
    }
  }

  // Process expired points
  async processExpiredPoints() {
    try {
      const expiredPoints = await prisma.pointHistory.findMany({
        where: {
          type: PointTransactionType.EARNED,
          expiresAt: {
            lte: new Date()
          },
          // Check if not already expired
          NOT: {
            customer: {
              pointHistory: {
                some: {
                  type: PointTransactionType.EXPIRED,
                  sourceId: {
                    equals: prisma.pointHistory.fields.id
                  }
                }
              }
            }
          }
        },
        include: {
          customer: true
        }
      })

      for (const expiredEntry of expiredPoints) {
        // Record expiration
        await this.recordPointsTransaction(
          expiredEntry.customerId,
          -expiredEntry.amount,
          PointTransactionType.EXPIRED,
          'SYSTEM',
          expiredEntry.id,
          `Points expired from ${expiredEntry.source}`
        )
      }

      return expiredPoints.length
    } catch (error) {
      console.error('Error processing expired points:', error)
      throw error
    }
  }
}

// Export singleton instance
export const rewardService = new RewardService()