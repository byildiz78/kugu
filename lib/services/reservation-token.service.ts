import { randomUUID } from 'crypto'

export interface TransactionItem {
  productId: string
  productName: string
  category?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  discountAmount?: number
  isFree?: boolean
}

export interface AppliedCampaign {
  campaignId: string
  campaignName: string
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'
  discountAmount: number
  pointsEarned?: number
  freeItems?: string[]
}

export interface StampUsage {
  campaignId: string
  campaignName: string
  productName: string
  quantity: number
  value: number
}

export interface RewardUsage {
  rewardId: string
  rewardName: string
  pointCost: number
  discountAmount?: number
}

export interface ReservationData {
  id: string
  customerId: string
  items: TransactionItem[]
  calculations: {
    subtotal: number
    totalDiscounts: number
    finalAmount: number
    pointsToEarn: number
    pointsToUse: number
  }
  appliedCampaigns: AppliedCampaign[]
  usedStamps: StampUsage[]
  usedRewards: RewardUsage[]
  metadata?: {
    tierName?: string
    tierMultiplier?: number
    basePointRate?: number
  }
  createdAt: number
  expiresAt: number
}

class ReservationTokenService {
  private static instance: ReservationTokenService
  private cache: Map<string, ReservationData> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null
  private readonly TOKEN_EXPIRY_MS = 15 * 60 * 1000 // 15 minutes
  private readonly CLEANUP_INTERVAL_MS = 60 * 1000 // 1 minute

  private constructor() {
    // Start cleanup interval
    this.startCleanupInterval()
  }

  public static getInstance(): ReservationTokenService {
    if (!ReservationTokenService.instance) {
      ReservationTokenService.instance = new ReservationTokenService()
    }
    return ReservationTokenService.instance
  }

  async create(data: Omit<ReservationData, 'id' | 'createdAt' | 'expiresAt'>): Promise<string> {
    const token = randomUUID()
    const now = Date.now()
    const expiresAt = now + this.TOKEN_EXPIRY_MS

    const reservationData: ReservationData = {
      ...data,
      id: token,
      createdAt: now,
      expiresAt
    }

    this.cache.set(token, reservationData)

    // Log for debugging
    console.log(`[ReservationToken] Created token ${token} for customer ${data.customerId}`)

    return token
  }

  async validate(token: string): Promise<ReservationData | null> {
    const data = this.cache.get(token)

    if (!data) {
      console.log(`[ReservationToken] Token ${token} not found`)
      return null
    }

    if (data.expiresAt < Date.now()) {
      console.log(`[ReservationToken] Token ${token} expired`)
      this.cache.delete(token)
      return null
    }

    return data
  }

  async consume(token: string): Promise<ReservationData | null> {
    const data = await this.validate(token)

    if (data) {
      this.cache.delete(token)
      console.log(`[ReservationToken] Consumed token ${token}`)
    }

    return data
  }

  async extend(token: string, additionalMinutes: number = 5): Promise<boolean> {
    const data = this.cache.get(token)

    if (!data || data.expiresAt < Date.now()) {
      return false
    }

    data.expiresAt = Date.now() + (additionalMinutes * 60 * 1000)
    this.cache.set(token, data)

    console.log(`[ReservationToken] Extended token ${token} by ${additionalMinutes} minutes`)
    return true
  }

  async invalidate(token: string): Promise<boolean> {
    const existed = this.cache.has(token)
    this.cache.delete(token)

    if (existed) {
      console.log(`[ReservationToken] Invalidated token ${token}`)
    }

    return existed
  }

  getTokenInfo(token: string): { valid: boolean; expiresIn?: number; customerId?: string } | null {
    const data = this.cache.get(token)

    if (!data) {
      return { valid: false }
    }

    const now = Date.now()
    if (data.expiresAt < now) {
      return { valid: false }
    }

    return {
      valid: true,
      expiresIn: Math.floor((data.expiresAt - now) / 1000), // seconds
      customerId: data.customerId
    }
  }

  private cleanExpired(): void {
    const now = Date.now()
    let cleanedCount = 0

    for (const [token, data] of this.cache.entries()) {
      if (data.expiresAt < now) {
        this.cache.delete(token)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      console.log(`[ReservationToken] Cleaned ${cleanedCount} expired tokens`)
    }
  }

  private startCleanupInterval(): void {
    if (this.cleanupInterval) {
      return
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanExpired()
    }, this.CLEANUP_INTERVAL_MS)
  }

  stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  // Debug method
  getStats(): { totalTokens: number; tokens: Array<{ token: string; customerId: string; expiresIn: number }> } {
    const now = Date.now()
    const tokens = Array.from(this.cache.entries())
      .filter(([_, data]) => data.expiresAt > now)
      .map(([token, data]) => ({
        token,
        customerId: data.customerId,
        expiresIn: Math.floor((data.expiresAt - now) / 1000)
      }))

    return {
      totalTokens: tokens.length,
      tokens
    }
  }

  // Clear all tokens (for testing)
  clearAll(): void {
    this.cache.clear()
    console.log('[ReservationToken] All tokens cleared')
  }
}

// Export singleton instance
export const reservationTokenService = ReservationTokenService.getInstance()