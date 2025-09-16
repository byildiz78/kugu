'use client'

import { Gift, Star, Award } from 'lucide-react'
import { useTheme } from '@/lib/mobile/theme-context'

interface StampData {
  campaignId: string
  campaignName: string
  buyQuantity: number
  totalPurchased: number
  stampsEarned: number
  stampsUsed: number
  stampsAvailable: number
  progressToNext: number
  remainingForNextStamp: number
  discountValue: number
  discountType: string
  maxUsage: number
  canEarnMore: boolean
}

interface StampCardProps {
  stamp: StampData
}

export function StampCard({ stamp }: StampCardProps) {
  const { theme } = useTheme()

  const renderProgressBar = () => {
    const progress = (stamp.progressToNext / stamp.buyQuantity) * 100
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${theme.primary.gradient} transition-all duration-300 ease-out`}
          style={{ width: `${progress}%` }}
        />
      </div>
    )
  }

  const renderStampStars = () => {
    const stars = []
    const totalStars = stamp.stampsEarned
    const usedStars = stamp.stampsUsed
    const availableStars = totalStars - usedStars
    
    // Maximum stars to display inline
    const maxDisplay = 10
    
    if (totalStars <= maxDisplay) {
      // Show all stars inline if total is within display limit
      for (let i = 0; i < totalStars; i++) {
        const isUsed = i >= availableStars
        stars.push(
          <Star
            key={`star-${i}`}
            className={`w-6 h-6 transition-all duration-200 ${
              isUsed 
                ? 'text-gray-300 hover:text-gray-400' // Used/dim stars
                : 'text-yellow-400 hover:text-yellow-500 drop-shadow-sm' // Bright available stars
            }`}
            fill="currentColor"
          />
        )
      }
    } else {
      // Compact view for many stars - show counts with star icons
      return (
        <div className="flex items-center gap-4 bg-gradient-to-r from-yellow-50 to-amber-50 p-3 rounded-xl">
          {availableStars > 0 && (
            <div className="flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-400 drop-shadow-sm" fill="currentColor" />
              <span className="font-bold text-yellow-700 text-lg">{availableStars}</span>
              <span className="text-xs text-yellow-600">kullanıma hazır</span>
            </div>
          )}
          
          {usedStars > 0 && (
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-gray-400" fill="currentColor" />
              <span className="font-medium text-gray-600">{usedStars}</span>
              <span className="text-xs text-gray-500">kullanıldı</span>
            </div>
          )}
        </div>
      )
    }
    
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {stars}
      </div>
    )
  }

  const getRewardText = () => {
    if (stamp.discountType === 'PERCENTAGE') {
      return `%${stamp.discountValue} İndirim`
    } else if (stamp.discountType === 'FIXED_AMOUNT') {
      return `${stamp.discountValue}₺ İndirim`
    } else if (stamp.discountType === 'FREE_ITEM') {
      return 'Bedava Ürün'
    }
    return 'Ödül'
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
      {/* Enhanced Header */}
      <div className="flex items-start gap-4 mb-5">
        <div className="flex-shrink-0">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${theme.primary.gradient} flex items-center justify-center shadow-lg`}>
            <Award className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-lg leading-tight">{stamp.campaignName}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {stamp.buyQuantity} alışveriş → {getRewardText()}
          </p>
          
          {/* Reward Badge */}
          {stamp.stampsAvailable > 0 && (
            <div className="mt-2">
              <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-bold rounded-full shadow-md">
                <Gift className="w-4 h-4" />
                {stamp.stampsAvailable} Ödül Hazır!
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stars Display */}
      {stamp.stampsEarned > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">Kuğularım</h4>
            <div className="text-sm text-gray-600">
              {stamp.stampsEarned - stamp.stampsUsed} / {stamp.stampsEarned}
            </div>
          </div>
          {renderStampStars()}
        </div>
      )}

      {/* Progress Section */}
      {stamp.canEarnMore && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Sonraki damgaya {stamp.remainingForNextStamp} alışveriş kaldı
            </span>
            <span className="text-sm font-bold text-gray-900">
              {stamp.progressToNext}/{stamp.buyQuantity}
            </span>
          </div>
          
          <div className="relative">
            {renderProgressBar()}
            <div className="absolute -top-1 right-0 w-3 h-3 bg-white rounded-full border-2 border-gray-300 shadow-sm"></div>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="flex items-center justify-around p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl">
        <div className="text-center">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1">
            <span className="text-blue-600 font-bold text-sm">{stamp.totalPurchased}</span>
          </div>
          <p className="text-xs text-gray-600">Alışveriş</p>
        </div>
        
        <div className="w-px h-8 bg-gray-200"></div>
        
        <div className="text-center">
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-1">
            <Star className="w-4 h-4 text-yellow-600" fill="currentColor" />
          </div>
          <p className="text-xs text-gray-600">Damga</p>
        </div>
        
        <div className="w-px h-8 bg-gray-200"></div>
        
        <div className="text-center">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1">
            <span className="text-green-600 font-bold text-sm">{stamp.stampsUsed}</span>
          </div>
          <p className="text-xs text-gray-600">Kullanıldı</p>
        </div>
      </div>

      {/* Max usage indicator */}
      {!stamp.canEarnMore && stamp.stampsEarned >= stamp.maxUsage && (
        <div className="mt-4 text-center p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
          <div className="flex items-center justify-center gap-2">
            <Award className="w-4 h-4 text-amber-600" />
            <p className="text-sm text-amber-700 font-medium">
              Bu kampanyanın maksimum kullanımı tamamlandı
            </p>
          </div>
        </div>
      )}
    </div>
  )
}