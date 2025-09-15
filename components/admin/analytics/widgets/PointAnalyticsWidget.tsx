'use client'

import { useState, useEffect } from 'react'
import { BaseWidget } from './base/BaseWidget'
import { Badge } from '@/components/ui/badge'
// import { Progress } from '@/components/ui/progress' // Temporarily removed for build fix
import { 
  Star, 
  TrendingUp,
  TrendingDown,
  Coins,
  ArrowRightLeft,
  Target,
  Zap,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PointAnalyticsData {
  totalPointsIssued: number
  totalPointsRedeemed: number
  activePoints: number
  pointBurnRate: number
  averagePointsPerTransaction: number
  topPointCategories: {
    category: string
    points: number
    percentage: number
  }[]
  monthlyTrend: {
    month: string
    issued: number
    redeemed: number
    burnRate: number
  }[]
  pointsExpiringSoon: number
  averagePointLifetime: number
  redemptionPatterns: {
    timeOfDay: { hour: number, redemptions: number }[]
    dayOfWeek: { day: string, redemptions: number }[]
  }
}

interface PointAnalyticsWidgetProps {
  dateRange: {
    start: Date
    end: Date
  }
  loading?: boolean
}

export function PointAnalyticsWidget({ dateRange, loading }: PointAnalyticsWidgetProps) {
  const [data, setData] = useState<PointAnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()

  const fetchPointAnalytics = async () => {
    try {
      setIsLoading(true)
      setError(undefined)
      
      const params = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString()
      })

      const response = await fetch(`/api/analytics/points?${params}`)
      if (!response.ok) throw new Error('Failed to fetch point analytics')
      
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching point analytics:', error)
      setError('Puan analizi verileri yüklenirken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPointAnalytics()
  }, [dateRange])

  const renderPointOverview = () => {
    if (!data) return null

    const burnRateColor = data.pointBurnRate > 70 ? 'text-green-600' : 
                         data.pointBurnRate > 50 ? 'text-yellow-600' : 'text-red-600'
    
    const burnRateBg = data.pointBurnRate > 70 ? 'bg-green-50' : 
                      data.pointBurnRate > 50 ? 'bg-yellow-50' : 'bg-red-50'

    return (
      <div className="space-y-4">
        {/* Main Stats */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-700">Puan Ekonomisi</span>
              </div>
              <div className={cn('px-2 py-1 rounded-full text-xs font-medium', burnRateBg, burnRateColor)}>
                %{(data.pointBurnRate || 0).toFixed(1)} yakma oranı
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {data.totalPointsIssued.toLocaleString('tr-TR')}
                </div>
                <div className="text-xs text-gray-600">Dağıtılan</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">
                  {data.totalPointsRedeemed.toLocaleString('tr-TR')}
                </div>
                <div className="text-xs text-gray-600">Kullanılan</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-600">
                  {data.activePoints.toLocaleString('tr-TR')}
                </div>
                <div className="text-xs text-gray-600">Aktif</div>
              </div>
            </div>
          </div>

          {/* Burn Rate Progress */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Puan Yakma Oranı</span>
              <span className={cn('text-sm font-bold', burnRateColor)}>
                %{(data.pointBurnRate || 0).toFixed(1)}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={cn('h-full rounded-full transition-all', 
                  data.pointBurnRate > 80 ? 'bg-red-500' :
                  data.pointBurnRate > 60 ? 'bg-yellow-500' : 'bg-green-500'
                )}
                style={{
                  width: `${data.pointBurnRate || 0}%`
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Düşük</span>
              <span>Yüksek</span>
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <ArrowRightLeft className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-gray-600">İşlem Başına</span>
            </div>
            <div className="font-semibold text-gray-900">
              {(data.averagePointsPerTransaction || 0).toFixed(0)} puan
            </div>
          </div>
          
          <div className="p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-600">Ortalama Ömür</span>
            </div>
            <div className="font-semibold text-gray-900">
              {data.averagePointLifetime} gün
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderTopCategories = () => {
    if (!data?.topPointCategories.length) return null

    return (
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700 flex items-center gap-2">
          <Target className="w-4 h-4" />
          En Çok Puan Kazanılan Kategoriler
        </h4>
        
        {data.topPointCategories.slice(0, 5).map((category, index) => (
          <div key={category.category} className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
              {index + 1}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">
                  {category.category}
                </span>
                <span className="text-sm text-gray-600">
                  {category.points.toLocaleString('tr-TR')} puan
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden flex-1">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{
                      width: `${category.percentage || 0}%`
                    }}
                  />
                </div>
                <span className="text-xs text-gray-500 min-w-[3rem]">
                  %{(category.percentage || 0).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderExpiringPoints = () => {
    if (!data) return null

    const expiringPercentage = (data.pointsExpiringSoon / data.activePoints) * 100

    return (
      <div className={cn(
        'p-3 rounded-lg border-2 border-dashed',
        expiringPercentage > 10 ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'
      )}>
        <div className="flex items-center gap-2 mb-2">
          <Clock className={cn(
            'w-4 h-4',
            expiringPercentage > 10 ? 'text-red-500' : 'text-yellow-500'
          )} />
          <span className="text-sm font-medium text-gray-700">
            Yakında Süresi Dolacak Puanlar
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <div className={cn(
              'text-lg font-bold',
              expiringPercentage > 10 ? 'text-red-600' : 'text-yellow-600'
            )}>
              {data.pointsExpiringSoon.toLocaleString('tr-TR')}
            </div>
            <div className="text-xs text-gray-600">
              puan (30 gün içinde)
            </div>
          </div>
          
          <Badge className={cn(
            'text-xs',
            expiringPercentage > 10 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
          )}>
            %{(expiringPercentage || 0).toFixed(1)}
          </Badge>
        </div>
      </div>
    )
  }

  return (
    <BaseWidget
      title="⭐ Puan Analizi"
      description="Puan ekonomisi ve kullanım analizi"
      loading={loading || isLoading}
      error={error}
      headerIcon={<Star className="w-5 h-5 text-yellow-600" />}
      actions={{
        onRefresh: fetchPointAnalytics,
        onExport: () => console.log('Export point analytics'),
      }}
    >
      <div className="space-y-6">
        {data && renderPointOverview()}
        {data && renderTopCategories()}
        {data && renderExpiringPoints()}
      </div>
    </BaseWidget>
  )
}