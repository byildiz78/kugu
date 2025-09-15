'use client'

import { ThemedCard } from '@/components/mobile/ui/ThemedCard'
import { TrendingUp, Trophy, Star } from 'lucide-react'
import { useTheme } from '@/lib/mobile/theme-context'

interface PointsCardProps {
  points: number
  tierName?: string
  tierDisplayName?: string
  tierColor?: string
  pointsToNextTier?: number
  nextTierName?: string
}

export function PointsCard({
  points,
  tierName = 'REGULAR',
  tierDisplayName = 'Regular',
  tierColor = '#6b7280',
  pointsToNextTier,
  nextTierName
}: PointsCardProps) {
  const { theme } = useTheme()
  
  // Calculate progress percentage
  const progressPercentage = pointsToNextTier 
    ? Math.min((points / (points + pointsToNextTier)) * 100, 100)
    : 100

  return (
    <ThemedCard 
      variant="primary" 
      className="relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-white/80 text-sm font-medium mb-1">Mevcut Puanınız</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">{points.toLocaleString('tr-TR')}</span>
              <span className="text-white/60 text-sm">puan</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <Trophy className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">{tierDisplayName}</span>
          </div>
        </div>

        {/* Progress to Next Tier */}
        {pointsToNextTier && nextTierName && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-white/80">Sonraki Seviye</span>
              <span className="text-white font-medium">{nextTierName}</span>
            </div>
            
            <div className="relative">
              {/* Progress Bar Background */}
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                {/* Progress Bar Fill */}
                <div 
                  className="h-full bg-white transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              
              {/* Points to Next Tier */}
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-white/60">
                  {pointsToNextTier} puan kaldı
                </span>
                <span className="text-xs text-white/60">
                  %{Math.round(progressPercentage)} tamamlandı
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Hint */}
        <div className="mt-4 flex items-center gap-2 text-white/80">
          <Star className="w-4 h-4" />
          <span className="text-sm">Her alışverişte puan kazanın!</span>
        </div>
      </div>
    </ThemedCard>
  )
}