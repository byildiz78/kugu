import { prisma } from '@/lib/prisma'
import { rewardEvents } from '@/lib/events/reward.events'

export class TierService {
  /**
   * Check and potentially upgrade a customer's tier based on their current stats
   * @param customerId - The customer to check
   * @param reason - Reason for tier check (e.g., 'TRANSACTION_COMPLETED')
   */
  async checkAndUpgradeTier(customerId: string, reason: string = 'AUTOMATIC') {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          tier: true,
          restaurant: true
        }
      })

      if (!customer) {
        throw new Error('Customer not found')
      }

      // Get all active tiers for this restaurant, ordered by level
      const tiers = await prisma.tier.findMany({
        where: {
          restaurantId: customer.restaurantId,
          isActive: true
        },
        orderBy: { level: 'asc' }
      })

      if (tiers.length === 0) {
        console.log('No tiers defined for restaurant')
        return null
      }

      // Find the highest tier the customer qualifies for
      let eligibleTier = null
      
      for (const tier of tiers) {
        const meetsRequirements = this.checkTierRequirements(customer, tier)
        if (meetsRequirements) {
          eligibleTier = tier
        }
      }

      // If no eligible tier found, assign the lowest tier (level 0)
      if (!eligibleTier) {
        eligibleTier = tiers.find(t => t.level === 0) || tiers[0]
      }

      // Check if customer needs tier upgrade
      const currentTierLevel = customer.tier?.level ?? -1
      
      if (eligibleTier.level > currentTierLevel) {
        await this.upgradeTier(customer.id, eligibleTier.id, reason)
        return eligibleTier
      }

      return null // No upgrade needed
    } catch (error) {
      console.error('Error checking tier upgrade:', error)
      throw error
    }
  }

  /**
   * Check if customer meets requirements for a specific tier
   */
  private checkTierRequirements(customer: any, tier: any): boolean {
    // Check minimum total spent
    if (tier.minTotalSpent && customer.totalSpent < tier.minTotalSpent) {
      return false
    }

    // Check minimum visit count
    if (tier.minVisitCount && customer.visitCount < tier.minVisitCount) {
      return false
    }

    // Check minimum points
    if (tier.minPoints && customer.points < tier.minPoints) {
      return false
    }

    return true
  }

  /**
   * Upgrade customer to a new tier
   */
  private async upgradeTier(customerId: string, newTierId: string, reason: string) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { tier: true }
    })

    if (!customer) {
      throw new Error('Customer not found')
    }

    const newTier = await prisma.tier.findUnique({
      where: { id: newTierId }
    })

    if (!newTier) {
      throw new Error('New tier not found')
    }

    // Update customer tier
    await prisma.customer.update({
      where: { id: customerId },
      data: { tierId: newTierId }
    })

    // Record tier history
    await prisma.tierHistory.create({
      data: {
        customerId,
        fromTierId: customer.tierId,
        toTierId: newTierId,
        reason: `Tier upgraded from ${customer.tier?.displayName || 'No Tier'} to ${newTier.displayName}`,
        triggeredBy: reason
      }
    })

    // Emit tier changed event for rewards processing
    if (customer.tier) {
      rewardEvents.emitTierChanged(
        customerId,
        customer.level, // legacy level enum
        customer.level  // legacy level enum  
      )
    }

    console.log(`Customer ${customerId} upgraded to tier ${newTier.displayName}`)
  }

  /**
   * Get customer's tier with calculated benefits
   */
  async getCustomerTierInfo(customerId: string) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        tier: true,
        tierHistory: {
          include: {
            fromTier: true,
            toTier: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })

    if (!customer) {
      throw new Error('Customer not found')
    }

    // Calculate progress to next tier
    const nextTier = await prisma.tier.findFirst({
      where: {
        restaurantId: customer.restaurantId,
        level: { gt: customer.tier?.level || -1 },
        isActive: true
      },
      orderBy: { level: 'asc' }
    })

    let progress = null
    if (nextTier) {
      progress = this.calculateTierProgress(customer, nextTier)
    }

    return {
      customer,
      currentTier: customer.tier,
      nextTier,
      progress,
      history: customer.tierHistory
    }
  }

  /**
   * Calculate progress towards next tier
   */
  private calculateTierProgress(customer: any, nextTier: any) {
    const requirements = []

    if (nextTier.minTotalSpent) {
      const progress = Math.min((customer.totalSpent / nextTier.minTotalSpent) * 100, 100)
      requirements.push({
        type: 'totalSpent',
        label: 'Toplam Harcama',
        current: customer.totalSpent,
        target: nextTier.minTotalSpent,
        progress,
        unit: '₺'
      })
    }

    if (nextTier.minVisitCount) {
      const progress = Math.min((customer.visitCount / nextTier.minVisitCount) * 100, 100)
      requirements.push({
        type: 'visitCount',
        label: 'Ziyaret Sayısı',
        current: customer.visitCount,
        target: nextTier.minVisitCount,
        progress,
        unit: 'ziyaret'
      })
    }

    if (nextTier.minPoints) {
      const progress = Math.min((customer.points / nextTier.minPoints) * 100, 100)
      requirements.push({
        type: 'points',
        label: 'Puan',
        current: customer.points,
        target: nextTier.minPoints,
        progress,
        unit: 'puan'
      })
    }

    const overallProgress = requirements.length > 0 
      ? requirements.reduce((sum, req) => sum + req.progress, 0) / requirements.length
      : 0

    return {
      overall: overallProgress,
      requirements
    }
  }

  /**
   * Get all tiers for a restaurant with customer counts
   */
  async getRestaurantTiers(restaurantId: string) {
    const tiers = await prisma.tier.findMany({
      where: { restaurantId },
      include: {
        _count: {
          select: {
            customers: true
          }
        }
      },
      orderBy: { level: 'asc' }
    })

    return tiers
  }

  /**
   * Migrate customers from legacy level enum to new tier system
   */
  async migrateLegacyLevels(restaurantId: string) {
    // This method would help migrate existing customers from the old enum system
    // to the new tier system when first setting up tiers
    
    const customers = await prisma.customer.findMany({
      where: { 
        restaurantId,
        tierId: null // Not yet migrated
      }
    })

    const tiers = await prisma.tier.findMany({
      where: { restaurantId },
      orderBy: { level: 'asc' }
    })

    // Map legacy levels to tier levels
    const levelMapping = {
      'REGULAR': 0,
      'BRONZE': 1,
      'SILVER': 2,
      'GOLD': 3,
      'PLATINUM': 4
    }

    for (const customer of customers) {
      const targetLevel = levelMapping[customer.level as keyof typeof levelMapping] ?? 0
      const targetTier = tiers.find((t: any) => t.level === targetLevel)
      
      if (targetTier) {
        await prisma.customer.update({
          where: { id: customer.id },
          data: { tierId: targetTier.id }
        })

        // Record migration in history
        await prisma.tierHistory.create({
          data: {
            customerId: customer.id,
            fromTierId: null,
            toTierId: targetTier.id,
            reason: `Migrated from legacy level: ${customer.level}`,
            triggeredBy: 'MIGRATION'
          }
        })
      }
    }

    console.log(`Migrated ${customers.length} customers to new tier system`)
  }
}

// Export singleton instance
export const tierService = new TierService()