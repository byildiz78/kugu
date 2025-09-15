'use client'

import { useState, useEffect } from 'react'
import { BaseWidget } from './base/BaseWidget'
import { Badge } from '@/components/ui/badge'
// import { Progress } from '@/components/ui/progress' // Temporarily removed for build fix
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RevenueAnalyticsData {
  totalRevenue: number
  revenueGrowth: number
  revenueFromLoyaltyMembers: number
  loyaltyProgramROI: number
  averageOrderValue: number
  averageOrderValueGrowth: number
  revenueBySegment: {
    segment: string
    revenue: number
    percentage: number
    growth: number
    color: string
  }[]
  monthlyRevenue: {
    month: string
    total: number
    loyalty: number
    growth: number
  }[]
  revenueChannels: {
    channel: string
    revenue: number
    percentage: number
    orders: number
    averageOrderValue: number
  }[]
  pointsImpactOnRevenue: {
    revenueFromPointRedemptions: number
    averageSpendWhenUsingPoints: number
    averageSpendWithoutPoints: number
    pointsInfluenceRate: number
  }
  topRevenueCategories: {
    category: string
    revenue: number
    percentage: number
    growth: number
  }[]
}

interface RevenueAnalyticsWidgetProps {
  dateRange: {
    start: Date
    end: Date
  }
  loading?: boolean
}

export function RevenueAnalyticsWidget({ dateRange, loading }: RevenueAnalyticsWidgetProps) {
  const [data, setData] = useState<RevenueAnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()

  const fetchRevenueAnalytics = async () => {
    try {
      setIsLoading(true)
      setError(undefined)
      
      const params = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString()
      })

      const response = await fetch(`/api/analytics/revenue?${params}`)
      if (!response.ok) throw new Error('Failed to fetch revenue analytics')
      
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching revenue analytics:', error)
      setError('Gelir analizi verileri yüklenirken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRevenueAnalytics()
  }, [dateRange])

  const renderRevenueOverview = () => {
    if (!data) return null

    const loyaltyPercentage = (data.revenueFromLoyaltyMembers / data.totalRevenue) * 100

    return (
      <div className="space-y-4">
        {/* Main Revenue Stats */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-700">Toplam Gelir</span>
                {data.revenueGrowth !== 0 && (
                  <Badge className={cn(
                    'text-xs',
                    data.revenueGrowth > 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  )}>
                    {data.revenueGrowth > 0 ? '+' : ''}{(data.revenueGrowth || 0).toFixed(1)}%
                    {data.revenueGrowth > 0 ? (
                      <ArrowUpRight className="w-3 h-3 ml-1" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 ml-1" />
                    )}
                  </Badge>
                )}
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {data.totalRevenue.toLocaleString('tr-TR')}₺
              </div>
            </div>
          </div>
        </div>

        {/* Loyalty Program Impact */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-gray-600">Sadakat Geliri</span>
            </div>
            <div className="font-semibold text-gray-900">
              {data.revenueFromLoyaltyMembers.toLocaleString('tr-TR')}₺
            </div>
            <div className="text-xs text-purple-600">
              %{(loyaltyPercentage || 0).toFixed(1)} oranında
            </div>
          </div>

          <div className="p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-orange-600" />
              <span className="text-xs text-gray-600">Program ROI</span>
            </div>
            <div className="font-semibold text-gray-900">
              {(data.loyaltyProgramROI || 0).toFixed(1)}x
            </div>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="p-3 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Ortalama Sipariş Değeri
            </span>
            {data.averageOrderValueGrowth !== 0 && (
              <Badge className={cn(
                'text-xs',
                data.averageOrderValueGrowth > 0 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              )}>
                {(data.averageOrderValueGrowth || 0) > 0 ? '+' : ''}{(data.averageOrderValueGrowth || 0).toFixed(1)}%
              </Badge>
            )}
          </div>
          <div className="text-lg font-bold text-gray-900">
            {(data.averageOrderValue || 0).toFixed(0)}₺
          </div>
        </div>
      </div>
    )
  }

  const renderRevenueBySegment = () => {
    if (!data?.revenueBySegment.length) return null

    return (
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700 flex items-center gap-2">
          <PieChart className="w-4 h-4" />
          Segment Bazında Gelir
        </h4>
        
        {data.revenueBySegment.map((segment) => (
          <div key={segment.segment} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-sm font-medium text-gray-900">
                  {segment.segment}
                </span>
                {segment.growth !== 0 && (
                  <div className="flex items-center gap-1">
                    {segment.growth > 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500" />
                    )}
                    <span className={cn(
                      'text-xs',
                      segment.growth > 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {(segment.growth || 0) > 0 ? '+' : ''}{(segment.growth || 0).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              <span className="text-sm text-gray-600">
                {segment.revenue.toLocaleString('tr-TR')}₺
              </span>
            </div>
            
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all"
                style={{
                  width: `${segment.percentage || 0}%`,
                  backgroundColor: segment.color
                }}
              />
            </div>
            <div className="text-xs text-gray-500 text-right">
              %{(segment.percentage || 0).toFixed(1)}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderRevenueChannels = () => {
    if (!data?.revenueChannels.length) return null

    return (
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Kanal Bazında Gelir
        </h4>
        
        {data.revenueChannels.map((channel) => (
          <div key={channel.channel} className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">{channel.channel}</span>
              <span className="text-sm font-bold text-green-600">
                {channel.revenue.toLocaleString('tr-TR')}₺
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-xs text-gray-600">
              <div>
                <div className="font-medium">%{(channel.percentage || 0).toFixed(1)}</div>
                <div>Pay</div>
              </div>
              <div>
                <div className="font-medium">{channel.orders}</div>
                <div>Sipariş</div>
              </div>
              <div>
                <div className="font-medium">{(channel.averageOrderValue || 0).toFixed(0)}₺</div>
                <div>Ort. Değer</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderPointsImpact = () => {
    if (!data?.pointsImpactOnRevenue) return null

    const { pointsImpactOnRevenue: impact } = data
    const spendingDifference = impact.averageSpendWhenUsingPoints - impact.averageSpendWithoutPoints
    const spendingIncrease = (spendingDifference / impact.averageSpendWithoutPoints) * 100

    return (
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700 flex items-center gap-2">
          <Target className="w-4 h-4" />
          Puan Kullanımının Gelir Etkisi
        </h4>
        
        <div className="grid grid-cols-1 gap-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-700 mb-1">Puan Kullanım Etki Oranı</div>
            <div className="text-lg font-bold text-blue-900">
              %{(impact.pointsInfluenceRate || 0).toFixed(1)}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 border border-green-200 rounded-lg">
              <div className="text-xs text-gray-600">Puanla Harcama</div>
              <div className="font-semibold text-green-600">
                {(impact.averageSpendWhenUsingPoints || 0).toFixed(0)}₺
              </div>
            </div>
            
            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="text-xs text-gray-600">Puansız Harcama</div>
              <div className="font-semibold text-gray-600">
                {(impact.averageSpendWithoutPoints || 0).toFixed(0)}₺
              </div>
            </div>
          </div>
          
          {spendingDifference > 0 && (
            <div className="p-2 bg-green-50 rounded text-center">
              <div className="text-xs text-green-700">
                Puan kullanımı ortalama
              </div>
              <div className="font-bold text-green-800">
                +{(spendingIncrease || 0).toFixed(1)}% daha fazla harcama
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderTopCategories = () => {
    if (!data?.topRevenueCategories.length) return null

    return (
      <div className="space-y-2">
        <h4 className="font-medium text-gray-700 text-sm">En Karlı Kategoriler</h4>
        
        {data.topRevenueCategories.slice(0, 4).map((category, index) => (
          <div key={category.category} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">#{index + 1}</span>
              <span className="text-gray-900">{category.category}</span>
              {category.growth > 0 && (
                <TrendingUp className="w-3 h-3 text-green-500" />
              )}
            </div>
            <div className="text-right">
              <div className="font-medium text-gray-900">
                {category.revenue.toLocaleString('tr-TR')}₺
              </div>
              <div className="text-xs text-gray-500">
                %{(category.percentage || 0).toFixed(1)}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <BaseWidget
      title="Gelir Analizi"
      description="Sadakat programının gelir etkisi ve trend analizi"
      loading={loading || isLoading}
      error={error}
      headerIcon={<DollarSign className="w-5 h-5 text-green-600" />}
      actions={{
        onRefresh: fetchRevenueAnalytics,
        onExport: () => console.log('Export revenue analytics'),
      }}
    >
      <div className="space-y-6">
        {data && renderRevenueOverview()}
        
        <Tabs defaultValue="segments" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="segments">
              Segmentler
            </TabsTrigger>
            <TabsTrigger value="channels">
              Kanallar
            </TabsTrigger>
            <TabsTrigger value="impact">
              Puan Etkisi
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="segments" className="mt-4">
            {data && renderRevenueBySegment()}
          </TabsContent>
          
          <TabsContent value="channels" className="mt-4">
            {data && renderRevenueChannels()}
          </TabsContent>
          
          <TabsContent value="impact" className="mt-4">
            {data && renderPointsImpact()}
            {data && renderTopCategories()}
          </TabsContent>
        </Tabs>
      </div>
    </BaseWidget>
  )
}