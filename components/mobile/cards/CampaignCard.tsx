'use client'

import { ThemedCard } from '@/components/mobile/ui/ThemedCard'
import { Tag, Clock, ChevronRight, TrendingUp, Gift, Percent } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface CampaignCardProps {
  id: string
  name: string
  description: string
  type: string
  discountType?: string
  discountValue?: number
  endDate: string
  isActive: boolean
  usageCount?: number
  maxUsagePerCustomer?: number
}

export function CampaignCard({
  id,
  name,
  description,
  type,
  discountType,
  discountValue,
  endDate,
  isActive,
  usageCount = 0,
  maxUsagePerCustomer = 1
}: CampaignCardProps) {
  const router = useRouter()
  const remainingUsage = maxUsagePerCustomer - usageCount

  // Get campaign icon based on type
  const getTypeIcon = () => {
    switch (type) {
      case 'DISCOUNT':
      case 'CATEGORY_DISCOUNT':
        return <Percent className="w-5 h-5" />
      case 'PRODUCT_BASED':
      case 'BUY_X_GET_Y':
        return <Gift className="w-5 h-5" />
      case 'LOYALTY_POINTS':
        return <TrendingUp className="w-5 h-5" />
      default:
        return <Tag className="w-5 h-5" />
    }
  }

  // Format discount display
  const getDiscountDisplay = () => {
    if (!discountType || !discountValue) return null
    
    if (discountType === 'PERCENTAGE') {
      return `%${discountValue} İndirim`
    } else if (discountType === 'FIXED_AMOUNT') {
      return `${discountValue} TL İndirim`
    }
    return null
  }

  const handleClick = () => {
    router.push(`/mobile/campaigns/${id}`)
  }

  if (!isActive) return null

  return (
    <ThemedCard 
      interactive 
      onClick={handleClick}
      className="relative"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-theme-primary/10 rounded-theme flex items-center justify-center text-theme-primary">
            {getTypeIcon()}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-theme-text-primary line-clamp-1">
            {name}
          </h3>
          
          <p className="text-sm text-theme-text-secondary mt-1 line-clamp-2">
            {description}
          </p>

          {/* Discount Badge */}
          {getDiscountDisplay() && (
            <div className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-theme-accent/10 text-theme-accent rounded-full text-xs font-medium">
              {getDiscountDisplay()}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1 text-xs text-theme-text-secondary">
              <Clock className="w-3 h-3" />
              <span>
                {format(new Date(endDate), 'd MMM', { locale: tr })} tarihine kadar
              </span>
            </div>

            {remainingUsage > 0 && (
              <span className="text-xs font-medium text-theme-success">
                {remainingUsage} hak kaldı
              </span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-theme-text-secondary flex-shrink-0" />
      </div>
    </ThemedCard>
  )
}