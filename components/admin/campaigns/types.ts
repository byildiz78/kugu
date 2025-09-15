// Shared types and constants for campaign forms

export interface Product {
  id: string
  name: string
  category: string
  price: number
}

export interface Segment {
  id: string
  name: string
}

export interface CampaignFormData {
  name: string
  description: string
  startDate: string
  endDate: string
  isActive: boolean
  
  // Trigger conditions
  triggerType: 'purchase_amount' | 'product_purchase' | 'category_purchase' | 'visit_count' | 'birthday'
  minPurchase?: number
  targetProducts?: string[]
  targetCategories?: string[]
  requiredQuantity?: number
  visitCount?: number
  
  // Rewards
  rewardType: 'discount_percentage' | 'discount_fixed' | 'free_product' | 'points_multiplier' | 'free_shipping'
  discountValue?: number
  freeProducts?: string[]
  pointsMultiplier?: number
  
  // Targeting
  maxUsage?: number
  maxUsagePerCustomer: number
  segmentIds?: string[]
  sendNotification: boolean
  notificationTitle?: string
  notificationMessage?: string
}

export const TRIGGER_TYPES = [
  {
    value: 'purchase_amount' as const,
    label: 'Belirli Tutarda Alışveriş',
    description: 'Minimum alışveriş tutarı',
    icon: 'ShoppingCart'
  },
  {
    value: 'product_purchase' as const,
    label: 'Belirli Ürün Alımı',
    description: 'Spesifik ürünler alındığında',
    icon: 'Package'
  },
  {
    value: 'category_purchase' as const,
    label: 'Kategori Alışverişi',
    description: 'Belirli kategorilerden alım',
    icon: 'Utensils'
  },
  {
    value: 'visit_count' as const,
    label: 'Ziyaret Sayısı',
    description: 'X. ziyarette tetiklenir',
    icon: 'Users'
  },
  {
    value: 'birthday' as const,
    label: 'Doğum Günü',
    description: 'Müşterinin doğum gününde',
    icon: 'Gift'
  }
]

export const REWARD_TYPES = [
  {
    value: 'discount_percentage' as const,
    label: 'Yüzde İndirim',
    description: '%10, %20 gibi',
    icon: 'Percent'
  },
  {
    value: 'discount_fixed' as const,
    label: 'Sabit İndirim',
    description: '50₺, 100₺ gibi',
    icon: 'Package'
  },
  {
    value: 'free_product' as const,
    label: 'Bedava Ürün',
    description: 'Seçilen ürünler bedava',
    icon: 'Gift'
  },
  {
    value: 'points_multiplier' as const,
    label: 'Ekstra Puan',
    description: '2x, 3x puan kazanımı',
    icon: 'Zap'
  }
]

export interface CampaignFormProps {
  formData: any
  register: any
  errors: any
  watch: any
  setValue: any
  products: Product[]
  segments: Segment[]
  categories: string[]
  
  // Selection states
  selectedProducts: string[]
  setSelectedProducts: (products: string[]) => void
  selectedCategories: string[]
  setSelectedCategories: (categories: string[]) => void
  selectedFreeProducts: string[]
  setSelectedFreeProducts: (products: string[]) => void
  selectedSegments: string[]
  setSelectedSegments: (segments: string[]) => void
  
  // Utility functions
  addToSelection: (item: string, list: string[], setList: (list: string[]) => void) => void
  removeFromSelection: (item: string, list: string[], setList: (list: string[]) => void) => void
}