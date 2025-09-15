import { EventEmitter } from 'node:events'
import { rewardService } from '@/lib/services/reward.service'
import { CustomerLevel } from '@prisma/client'

interface MilestoneReachedEvent {
  customerId: string
  milestone: string
  value: number
  timestamp: Date
}

interface TierChangedEvent {
  customerId: string
  oldTier: CustomerLevel
  newTier: CustomerLevel
  timestamp: Date
}

interface TransactionCompletedEvent {
  transactionId: string
  customerId: string
  amount: number
  timestamp: Date
}

interface PointsEarnedEvent {
  customerId: string
  points: number
  source: string
  sourceId?: string
  timestamp: Date
}

class RewardEventEmitter extends EventEmitter {
  constructor() {
    super()
    this.setupEventListeners()
  }

  private setupEventListeners() {
    // Transaction completed -> Process rewards
    this.on('transaction.completed', async (event: TransactionCompletedEvent) => {
      try {
        await rewardService.processTransactionRewards(event.transactionId)
      } catch (error) {
        console.error('Error processing transaction rewards:', error)
      }
    })

    // Milestone reached -> Check milestone rewards
    this.on('milestone.reached', async (event: MilestoneReachedEvent) => {
      try {
        await rewardService.checkMilestoneRewards(event.customerId)
      } catch (error) {
        console.error('Error processing milestone rewards:', error)
      }
    })

    // Tier changed -> Check tier rewards
    this.on('tier.changed', async (event: TierChangedEvent) => {
      try {
        await rewardService.checkTierRewards(event.customerId)
      } catch (error) {
        console.error('Error processing tier rewards:', error)
      }
    })

    // Points earned -> Record transaction
    this.on('points.earned', async (event: PointsEarnedEvent) => {
      try {
        await rewardService.recordPointsTransaction(
          event.customerId,
          event.points,
          'EARNED',
          event.source,
          event.sourceId,
          `Puan Kazanım ${event.source}`,
          365 // 1 year expiration
        )
      } catch (error) {
        console.error('Error recording points transaction:', error)
      }
    })

    // Points spent -> Record transaction
    this.on('points.spent', async (event: PointsEarnedEvent) => {
      try {
        await rewardService.recordPointsTransaction(
          event.customerId,
          -Math.abs(event.points), // Ensure negative
          'SPENT',
          event.source,
          event.sourceId,
          `Points spent on ${event.source}`
        )
      } catch (error) {
        console.error('Error recording points transaction:', error)
      }
    })
  }

  // Emit transaction completed
  emitTransactionCompleted(transactionId: string, customerId: string, amount: number) {
    this.emit('transaction.completed', {
      transactionId,
      customerId,
      amount,
      timestamp: new Date()
    })
  }

  // Emit milestone reached
  emitMilestoneReached(customerId: string, milestone: string, value: number) {
    this.emit('milestone.reached', {
      customerId,
      milestone,
      value,
      timestamp: new Date()
    })
  }

  // Emit tier changed
  emitTierChanged(customerId: string, oldTier: CustomerLevel, newTier: CustomerLevel) {
    this.emit('tier.changed', {
      customerId,
      oldTier,
      newTier,
      timestamp: new Date()
    })
  }

  // Emit points earned
  emitPointsEarned(customerId: string, points: number, source: string, sourceId?: string) {
    this.emit('points.earned', {
      customerId,
      points,
      source,
      sourceId,
      timestamp: new Date()
    })
  }

  // Emit points spent
  emitPointsSpent(customerId: string, points: number, source: string, sourceId?: string) {
    this.emit('points.spent', {
      customerId,
      points,
      source,
      sourceId,
      timestamp: new Date()
    })
  }
}

// Export singleton instance
export const rewardEvents = new RewardEventEmitter()