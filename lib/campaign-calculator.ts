import { CampaignManager } from './campaign-manager'

export interface TransactionItem {
  productId: string
  productName: string
  category?: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface CampaignApplication {
  campaignId: string
  campaignName: string
  discountAmount: number
  freeItems: string[]
  pointsEarned: number
  message: string
}

export interface TransactionCalculation {
  subtotal: number
  totalDiscount: number
  finalAmount: number
  pointsEarned: number
  appliedCampaigns: CampaignApplication[]
  freeItems: TransactionItem[]
}

export class CampaignCalculator {
  static async calculateTransaction(
    customerId: string,
    items: TransactionItem[],
    availableCampaigns: any[] = []
  ): Promise<TransactionCalculation> {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0)
    let totalDiscount = 0
    let totalPointsEarned = 0
    const appliedCampaigns: CampaignApplication[] = []
    const freeItems: TransactionItem[] = []

    // Get customer's campaign usage history
    const customerUsageHistory = await this.getCustomerUsageHistory(customerId)

    // Apply each eligible campaign
    for (const campaign of availableCampaigns) {
      const customerUsage = customerUsageHistory[campaign.id] || 0
      const totalUsage = campaign._count?.usages || 0

      const result = CampaignManager.applyCampaign(
        campaign,
        subtotal,
        customerId,
        customerUsage,
        totalUsage
      )

      if (result.isValid) {
        totalDiscount += result.discountAmount
        totalPointsEarned += result.pointsEarned

        appliedCampaigns.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          discountAmount: result.discountAmount,
          freeItems: result.freeProducts,
          pointsEarned: result.pointsEarned,
          message: result.message
        })

        // Add free items to the transaction
        if (result.freeProducts.length > 0) {
          const freeProductItems = await this.getFreeProductItems(result.freeProducts)
          freeItems.push(...freeProductItems)
        }
      }
    }

    // Calculate base loyalty points (1 point per 10 TL)
    const basePoints = Math.floor((subtotal - totalDiscount) / 10)
    totalPointsEarned += basePoints

    const finalAmount = Math.max(0, subtotal - totalDiscount)

    return {
      subtotal,
      totalDiscount,
      finalAmount,
      pointsEarned: totalPointsEarned,
      appliedCampaigns,
      freeItems
    }
  }

  static async getCustomerUsageHistory(customerId: string): Promise<Record<string, number>> {
    // This would query the database for customer's campaign usage
    // For now, return empty object
    return {}
  }

  static async getFreeProductItems(productIds: string[]): Promise<TransactionItem[]> {
    // This would query the database for product details
    // For now, return empty array
    return []
  }

  static async getEligibleCampaigns(
    customerId: string,
    restaurantId: string
  ): Promise<any[]> {
    // This would query active campaigns for the customer's segments
    // For now, return empty array
    return []
  }

  static generateOrderNumber(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 5)
    return `ORD-${timestamp}-${random}`.toUpperCase()
  }

  static validateTransaction(items: TransactionItem[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (items.length === 0) {
      errors.push('En az bir ürün seçilmelidir')
    }

    for (const item of items) {
      if (item.quantity <= 0) {
        errors.push(`${item.productName} için geçerli bir miktar giriniz`)
      }
      if (item.unitPrice < 0) {
        errors.push(`${item.productName} için geçerli bir fiyat giriniz`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}