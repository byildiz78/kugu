'use client'

import { ThemedCard } from '@/components/mobile/ui/ThemedCard'
import { Gift, Star, Clock, ChevronRight, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface RewardCardProps {
  id: string
  name: string
  description: string
  type: string
  category?: string
  pointsCost: number
  value?: number
  isAvailable: boolean
  customerPoints: number
  expiresAt?: string
  imageUrl?: string
  source?: string
  earnedAt?: string
}

export function RewardCard({
  id,
  name,
  description,
  type,
  category,
  pointsCost,
  value,
  isAvailable,
  customerPoints,
  expiresAt,
  imageUrl,
  source,
  earnedAt
}: RewardCardProps) {
  const router = useRouter()
  const canAfford = customerPoints >= pointsCost
  const isAccessible = isAvailable && canAfford

  // Get reward type icon and color
  const getTypeInfo = () => {
    switch (type) {
      case 'DISCOUNT':
        return { icon: Star, color: 'text-orange-500', bgColor: 'bg-orange-50' }
      case 'FREE_PRODUCT':
        return { icon: Gift, color: 'text-green-500', bgColor: 'bg-green-50' }
      case 'VOUCHER':
        return { icon: Star, color: 'text-purple-500', bgColor: 'bg-purple-50' }
      default:
        return { icon: Gift, color: 'text-blue-500', bgColor: 'bg-blue-50' }
    }
  }

  const { icon: TypeIcon, color, bgColor } = getTypeInfo()

  const handleClick = () => {
    router.push(`/mobile/rewards/${id}`)
  }

  return (
    <ThemedCard 
      interactive={isAccessible}
      onClick={isAccessible ? handleClick : undefined}
      className={`relative ${!isAccessible ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-4">
        {/* Icon/Image */}
        <div className="flex-shrink-0">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={name}
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className={`w-16 h-16 ${bgColor} rounded-lg flex items-center justify-center`}>
              <TypeIcon className={`w-8 h-8 ${color}`} />
            </div>
          )}
          
          {/* Unavailable overlay */}
          {!isAccessible && (
            <div className="absolute inset-0 w-16 h-16 bg-black/20 rounded-lg flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-theme-text-primary line-clamp-1 mb-1">
            {name}
          </h3>
          
          <p className="text-sm text-theme-text-secondary line-clamp-2 mb-3">
            {description}
          </p>

          {/* Points and Value */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-500" />
                <span className="font-semibold text-theme-text-primary">
                  {pointsCost.toLocaleString('tr-TR')} puan
                </span>
              </div>
              
              {value && (
                <span className="text-xs text-theme-text-secondary">
                  ({value} TL değerinde)
                </span>
              )}
            </div>

            {/* Status indicators */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {category && (
                  <span className="text-xs px-2 py-1 bg-theme-primary/10 text-theme-primary rounded-full">
                    {category}
                  </span>
                )}
                
                {!canAfford && (
                  <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full">
                    {(pointsCost - customerPoints).toLocaleString('tr-TR')} puan eksik
                  </span>
                )}
              </div>

              {/* Arrow indicator for navigation */}
              {isAccessible && (
                <ChevronRight className="w-4 h-4 text-theme-text-secondary" />
              )}
            </div>

            {/* Expiry */}
            {expiresAt && (
              <div className="flex items-center gap-1 text-xs text-theme-text-secondary">
                <Clock className="w-3 h-3" />
                <span>
                  {new Date(expiresAt) > new Date() 
                    ? `${Math.ceil((new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} gün kaldı`
                    : 'Süresi dolmuş'
                  }
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </ThemedCard>
  )
}