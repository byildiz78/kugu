'use client'

import { useEffect, useState } from 'react'
import { Award, Gift, Star } from 'lucide-react'
import { useTheme } from '@/lib/mobile/theme-context'
import { StampCard } from '@/components/mobile/cards/StampCard'
import { LoadingSpinner } from '@/components/mobile/ui/LoadingSpinner'

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

interface StampCollectionResponse {
  customerId: string
  stamps: StampData[]
  totalActiveStamps: number
}

interface StampCollectionProps {
  customerId: string
}

export function StampCollection({ customerId }: StampCollectionProps) {
  const { theme } = useTheme()
  const [stampData, setStampData] = useState<StampCollectionResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStampData()
  }, [customerId])

  const fetchStampData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/mobile/stamps?customerId=${customerId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_BEARER_TOKEN}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Damga bilgileri alınamadı')
      }
      
      const data = await response.json()
      setStampData(data)
    } catch (error) {
      console.error('Error fetching stamps:', error)
      setError(error instanceof Error ? error.message : 'Bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="text-center">
          <Award className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!stampData || stampData.stamps.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="text-center">
          <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-medium text-gray-700 mb-1">Henüz Damganız Yok</h3>
          <p className="text-gray-500 text-sm">
            Alışveriş yaparak damga toplamaya başlayın!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Enhanced Section Title */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-8 rounded-full bg-gradient-to-b ${theme.primary.gradient}`} />
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              ⭐ Damgalarım
            </h2>
            <p className="text-sm text-gray-600">
              {stampData.stamps.length} aktif kampanya
            </p>
          </div>
        </div>
        
        {stampData.totalActiveStamps > 0 && (
          <div className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-bold rounded-full shadow-lg animate-pulse">
            <Star className="w-4 h-4" fill="currentColor" />
            {stampData.totalActiveStamps} Hazır!
          </div>
        )}
      </div>

      {/* Enhanced Stamp Cards */}
      <div className="space-y-4">
        {stampData.stamps.map((stamp) => (
          <StampCard key={stamp.campaignId} stamp={stamp} />
        ))}
      </div>
    </div>
  )
}