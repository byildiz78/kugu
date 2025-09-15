export interface CampaignConditions {
  minPurchase?: number
  maxUsage?: number
  maxUsagePerCustomer?: number
  validHours?: {
    start: string
    end: string
  }
  validDays?: number[] // 1=Monday, 7=Sunday
  targetProducts?: string[]
  freeProducts?: string[]
  pointsRequired?: number
}

export interface CampaignResult {
  isValid: boolean
  discountAmount: number
  freeProducts: string[]
  pointsEarned: number
  message: string
}

export class CampaignManager {
  static validateTimeConditions(
    validHours?: { start: string; end: string },
    validDays?: number[]
  ): boolean {
    const now = new Date()
    
    // Check valid days
    if (validDays && validDays.length > 0) {
      const currentDay = now.getDay() === 0 ? 7 : now.getDay() // Convert Sunday from 0 to 7
      if (!validDays.includes(currentDay)) {
        return false
      }
    }
    
    // Check valid hours
    if (validHours) {
      const currentTime = now.toTimeString().slice(0, 5) // HH:MM format
      if (currentTime < validHours.start || currentTime > validHours.end) {
        return false
      }
    }
    
    return true
  }

  static calculateDiscount(
    orderAmount: number,
    discountType: string,
    discountValue: number,
    minPurchase?: number
  ): number {
    // Check minimum purchase requirement
    if (minPurchase && orderAmount < minPurchase) {
      return 0
    }

    switch (discountType) {
      case 'PERCENTAGE':
        return Math.min(orderAmount * (discountValue / 100), orderAmount)
      
      case 'FIXED_AMOUNT':
        return Math.min(discountValue, orderAmount)
      
      default:
        return 0
    }
  }

  static calculateLoyaltyPoints(
    orderAmount: number,
    pointsMultiplier: number = 1,
    basePointsPerLira: number = 0.1
  ): number {
    return Math.floor(orderAmount * basePointsPerLira * pointsMultiplier)
  }

  static checkUsageLimit(
    currentUsage: number,
    maxUsage?: number,
    customerUsage: number = 0,
    maxUsagePerCustomer: number = 1
  ): boolean {
    // Check global usage limit
    if (maxUsage && currentUsage >= maxUsage) {
      return false
    }
    
    // Check per-customer usage limit
    if (customerUsage >= maxUsagePerCustomer) {
      return false
    }
    
    return true
  }

  static applyCampaign(
    campaign: any,
    orderAmount: number,
    customerId: string,
    customerUsage: number = 0,
    totalUsage: number = 0
  ): CampaignResult {
    const result: CampaignResult = {
      isValid: false,
      discountAmount: 0,
      freeProducts: [],
      pointsEarned: 0,
      message: ''
    }

    // Check if campaign is active
    if (!campaign.isActive) {
      result.message = 'Kampanya aktif değil'
      return result
    }

    // Check date range
    const now = new Date()
    if (now < new Date(campaign.startDate) || now > new Date(campaign.endDate)) {
      result.message = 'Kampanya tarihi geçerli değil'
      return result
    }

    // Check usage limits
    if (!this.checkUsageLimit(totalUsage, campaign.maxUsage, customerUsage, campaign.maxUsagePerCustomer)) {
      result.message = 'Kampanya kullanım limiti aşıldı'
      return result
    }

    // Parse JSON conditions
    const validHours = campaign.validHours ? JSON.parse(campaign.validHours) : undefined
    const validDays = campaign.validDays ? JSON.parse(campaign.validDays) : undefined
    const freeProducts = campaign.freeProducts ? JSON.parse(campaign.freeProducts) : []

    // Check time conditions
    if (!this.validateTimeConditions(validHours, validDays)) {
      result.message = 'Kampanya şu anda geçerli değil'
      return result
    }

    // Apply campaign based on type
    switch (campaign.type) {
      case 'DISCOUNT':
        result.discountAmount = this.calculateDiscount(
          orderAmount,
          campaign.discountType,
          campaign.discountValue,
          campaign.minPurchase
        )
        break

      case 'PRODUCT_BASED':
        if (campaign.discountType === 'FREE_ITEM') {
          result.freeProducts = freeProducts
        } else {
          result.discountAmount = this.calculateDiscount(
            orderAmount,
            campaign.discountType,
            campaign.discountValue,
            campaign.minPurchase
          )
        }
        break

      case 'LOYALTY_POINTS':
        result.pointsEarned = this.calculateLoyaltyPoints(
          orderAmount,
          campaign.pointsMultiplier
        )
        break

      case 'TIME_BASED':
        result.discountAmount = this.calculateDiscount(
          orderAmount,
          campaign.discountType,
          campaign.discountValue,
          campaign.minPurchase
        )
        break

      case 'BIRTHDAY_SPECIAL':
        // Check if it's customer's birthday week
        // This would require customer birth date check
        result.freeProducts = freeProducts
        break

      case 'COMBO_DEAL':
        result.discountAmount = this.calculateDiscount(
          orderAmount,
          campaign.discountType,
          campaign.discountValue,
          campaign.minPurchase
        )
        break
    }

    if (result.discountAmount > 0 || result.freeProducts.length > 0 || result.pointsEarned > 0) {
      result.isValid = true
      result.message = 'Kampanya başarıyla uygulandı'
    } else {
      result.message = 'Kampanya koşulları sağlanmadı'
    }

    return result
  }
}

export const CAMPAIGN_TYPES = [
  { value: 'DISCOUNT', label: 'İndirim Kampanyası' },
  { value: 'PRODUCT_BASED', label: 'Ürün Bazlı Kampanya' },
  { value: 'LOYALTY_POINTS', label: 'Sadakat Puanı Kampanyası' },
  { value: 'TIME_BASED', label: 'Zaman Bazlı Kampanya' },
  { value: 'BIRTHDAY_SPECIAL', label: 'Doğum Günü Özel' },
  { value: 'COMBO_DEAL', label: 'Combo Kampanya' }
]

export const DISCOUNT_TYPES = [
  { value: 'PERCENTAGE', label: 'Yüzde İndirim (%)' },
  { value: 'FIXED_AMOUNT', label: 'Sabit Tutar İndirim (₺)' },
  { value: 'FREE_ITEM', label: 'Ücretsiz Ürün' },
  { value: 'BUY_ONE_GET_ONE', label: '2 Al 1 Öde' }
]