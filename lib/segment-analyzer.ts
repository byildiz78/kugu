export interface SegmentCriteria {
  averageOrderValue?: {
    min?: number
    max?: number
  }
  purchaseCount?: {
    min?: number
    max?: number
  }
  daysSinceFirstPurchase?: {
    min?: number
    max?: number
  }
  daysSinceLastPurchase?: {
    min?: number
    max?: number
  }
  period?: 'last_30_days' | 'last_90_days' | 'last_180_days' | 'last_year' | 'all_time'
}

export interface CustomerAnalytics {
  customerId: string
  averageOrderValue: number
  purchaseCount: number
  daysSinceFirstPurchase: number
  daysSinceLastPurchase: number
  totalSpent: number
}

export const DEFAULT_SEGMENTS = [
  {
    name: 'VIP Misafirler',
    description: 'Yüksek harcama yapan ve sık alışveriş eden değerli müşteriler',
    criteria: {
      averageOrderValue: { min: 700 },
      purchaseCount: { min: 20 },
      period: 'last_90_days'
    } as SegmentCriteria,
    isAutomatic: true
  },
  {
    name: 'Sadık Müşteriler',
    description: 'Düzenli alışveriş yapan güvenilir müşteriler',
    criteria: {
      averageOrderValue: { min: 250 },
      purchaseCount: { min: 5 },
      period: 'last_90_days'
    } as SegmentCriteria,
    isAutomatic: true
  },
  {
    name: 'Potansiyel Sadık Müşteriler',
    description: 'Sık alışveriş yapan ancak düşük harcama yapan müşteriler',
    criteria: {
      averageOrderValue: { min: 1 },
      purchaseCount: { min: 7 },
      period: 'last_90_days'
    } as SegmentCriteria,
    isAutomatic: true
  },
  {
    name: 'Kaybetme Riski Olanlar',
    description: 'Son dönemde alışveriş yapmayan müşteriler',
    criteria: {
      daysSinceLastPurchase: { min: 30 },
      purchaseCount: { min: 1 },
      period: 'all_time'
    } as SegmentCriteria,
    isAutomatic: true
  },
  {
    name: 'Kaybedilen Müşteriler',
    description: 'Uzun süredir alışveriş yapmayan müşteriler',
    criteria: {
      daysSinceLastPurchase: { min: 90 },
      purchaseCount: { min: 1 },
      period: 'all_time'
    } as SegmentCriteria,
    isAutomatic: true
  }
]

export function calculateCustomerAnalytics(
  transactions: Array<{ amount: number; transactionDate: Date }>,
  customerCreatedAt: Date
): CustomerAnalytics {
  if (transactions.length === 0) {
    const daysSinceCreated = Math.floor(
      (Date.now() - customerCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    return {
      customerId: '',
      averageOrderValue: 0,
      purchaseCount: 0,
      daysSinceFirstPurchase: daysSinceCreated,
      daysSinceLastPurchase: daysSinceCreated,
      totalSpent: 0
    }
  }

  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0)
  const averageOrderValue = totalSpent / transactions.length
  const purchaseCount = transactions.length

  const sortedTransactions = transactions.sort(
    (a, b) => a.transactionDate.getTime() - b.transactionDate.getTime()
  )
  
  const firstPurchase = sortedTransactions[0].transactionDate
  const lastPurchase = sortedTransactions[sortedTransactions.length - 1].transactionDate
  
  const daysSinceFirstPurchase = Math.floor(
    (Date.now() - firstPurchase.getTime()) / (1000 * 60 * 60 * 24)
  )
  
  const daysSinceLastPurchase = Math.floor(
    (Date.now() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24)
  )

  return {
    customerId: '',
    averageOrderValue,
    purchaseCount,
    daysSinceFirstPurchase,
    daysSinceLastPurchase,
    totalSpent
  }
}

export function filterTransactionsByPeriod(
  transactions: Array<{ amount: number; transactionDate: Date }>,
  period: SegmentCriteria['period']
): Array<{ amount: number; transactionDate: Date }> {
  if (period === 'all_time') return transactions

  const now = new Date()
  let cutoffDate: Date

  switch (period) {
    case 'last_30_days':
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case 'last_90_days':
      cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    case 'last_180_days':
      cutoffDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
      break
    case 'last_year':
      cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      break
    default:
      return transactions
  }

  return transactions.filter(t => t.transactionDate >= cutoffDate)
}

export function matchesSegmentCriteria(
  analytics: CustomerAnalytics,
  criteria: SegmentCriteria
): boolean {
  // Average Order Value check
  if (criteria.averageOrderValue) {
    if (criteria.averageOrderValue.min && analytics.averageOrderValue < criteria.averageOrderValue.min) {
      return false
    }
    if (criteria.averageOrderValue.max && analytics.averageOrderValue > criteria.averageOrderValue.max) {
      return false
    }
  }

  // Purchase Count check
  if (criteria.purchaseCount) {
    if (criteria.purchaseCount.min && analytics.purchaseCount < criteria.purchaseCount.min) {
      return false
    }
    if (criteria.purchaseCount.max && analytics.purchaseCount > criteria.purchaseCount.max) {
      return false
    }
  }

  // Days Since First Purchase check
  if (criteria.daysSinceFirstPurchase) {
    if (criteria.daysSinceFirstPurchase.min && analytics.daysSinceFirstPurchase < criteria.daysSinceFirstPurchase.min) {
      return false
    }
    if (criteria.daysSinceFirstPurchase.max && analytics.daysSinceFirstPurchase > criteria.daysSinceFirstPurchase.max) {
      return false
    }
  }

  // Days Since Last Purchase check
  if (criteria.daysSinceLastPurchase) {
    if (criteria.daysSinceLastPurchase.min && analytics.daysSinceLastPurchase < criteria.daysSinceLastPurchase.min) {
      return false
    }
    if (criteria.daysSinceLastPurchase.max && analytics.daysSinceLastPurchase > criteria.daysSinceLastPurchase.max) {
      return false
    }
  }

  return true
}