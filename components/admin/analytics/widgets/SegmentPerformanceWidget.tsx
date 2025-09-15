'use client'

import { useState, useEffect } from 'react'
import { BaseWidget } from './base/BaseWidget'
import { Badge } from '@/components/ui/badge'
// import { Progress } from '@/components/ui/progress' // Temporarily removed for build fix
import { Button } from '@/components/ui/button'
import { 
  Target, 
  Users,
  TrendingUp,
  TrendingDown,
  Star,
  ShoppingBag,
  DollarSign,
  Activity,
  ArrowRight,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SegmentData {
  id: string
  name: string
  description: string
  customerCount: number
  activeCustomers: number
  totalRevenue: number
  averageSpending: number
  pointsEarned: number
  pointsRedeemed: number
  engagementRate: number
  retentionRate: number
  growthRate: number
  campaignParticipation: number
  topProducts: string[]
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH'
  color: string
}

interface SegmentPerformanceData {
  segments: SegmentData[]
  overview: {
    totalSegments: number
    mostActiveSegment: string
    highestValueSegment: string
    fastestGrowingSegment: string
  }
  segmentMigration: {
    from: string
    to: string
    count: number
  }[]
}

interface SegmentPerformanceWidgetProps {
  dateRange: {
    start: Date
    end: Date
  }
  loading?: boolean
}

export function SegmentPerformanceWidget({ dateRange, loading }: SegmentPerformanceWidgetProps) {
  const [data, setData] = useState<SegmentPerformanceData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)

  const fetchSegmentPerformance = async () => {
    try {
      setIsLoading(true)
      setError(undefined)
      
      const params = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString()
      })

      const response = await fetch(`/api/analytics/segments?${params}`)
      if (!response.ok) throw new Error('Failed to fetch segment performance')
      
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching segment performance:', error)
      setError('Segment performans verileri yüklenirken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSegmentPerformance()
  }, [dateRange])

  const getRiskColor = (riskScore: SegmentData['riskScore']) => {
    switch (riskScore) {
      case 'LOW':
        return 'bg-green-100 text-green-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'HIGH':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const getRiskLabel = (riskScore: SegmentData['riskScore']) => {
    switch (riskScore) {
      case 'LOW':
        return 'Düşük Risk'
      case 'MEDIUM':
        return 'Orta Risk'
      case 'HIGH':
        return 'Yüksek Risk'
      default:
        return 'Bilinmeyen'
    }
  }

  const renderSegmentOverview = () => {
    if (!data?.overview) return null

    return (
      <div className="grid grid-cols-1 gap-3 mb-4">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600">
                {data.overview.totalSegments}
              </div>
              <div className="text-xs text-gray-600">Toplam Segment</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">
                {data.overview.mostActiveSegment}
              </div>
              <div className="text-xs text-gray-600">En Aktif</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderSegmentCard = (segment: SegmentData) => {
    const activationRate = (segment.activeCustomers / segment.customerCount) * 100
    const pointUtilization = (segment.pointsRedeemed / segment.pointsEarned) * 100

    return (
      <div
        key={segment.id}
        className={cn(
          'p-4 border-2 rounded-lg cursor-pointer transition-all duration-200',
          selectedSegment === segment.id 
            ? 'border-blue-300 bg-blue-50' 
            : 'border-gray-200 hover:border-gray-300'
        )}
        onClick={() => setSelectedSegment(
          selectedSegment === segment.id ? null : segment.id
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <div>
              <h4 className="font-medium text-gray-900">{segment.name}</h4>
              <p className="text-xs text-gray-600 mt-1">{segment.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={cn('text-xs', getRiskColor(segment.riskScore))}>
              {getRiskLabel(segment.riskScore)}
            </Badge>
            {segment.growthRate !== 0 && (
              <div className="flex items-center gap-1">
                {segment.growthRate > 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span className={cn(
                  'text-xs font-medium',
                  segment.growthRate > 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {segment.growthRate > 0 ? '+' : ''}{segment.growthRate.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-3 h-3 text-blue-500" />
            </div>
            <div className="text-sm font-semibold text-gray-900">
              {segment.customerCount.toLocaleString('tr-TR')}
            </div>
            <div className="text-xs text-gray-600">Müşteri</div>
          </div>
          
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="w-3 h-3 text-green-500" />
            </div>
            <div className="text-sm font-semibold text-gray-900">
              {segment.totalRevenue.toLocaleString('tr-TR')}₺
            </div>
            <div className="text-xs text-gray-600">Gelir</div>
          </div>
          
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Activity className="w-3 h-3 text-purple-500" />
            </div>
            <div className="text-sm font-semibold text-gray-900">
              %{segment.engagementRate.toFixed(1)}
            </div>
            <div className="text-xs text-gray-600">Katılım</div>
          </div>
        </div>

        {/* Detailed View */}
        {selectedSegment === segment.id && (
          <div className="space-y-3 pt-3 border-t border-gray-200">
            {/* Activation Rate */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700">Aktivasyon Oranı</span>
                <span className="text-sm font-medium text-gray-900">
                  %{activationRate.toFixed(1)}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{
                    width: `${activationRate || 0}%`
                  }}
                />
              </div>
            </div>

            {/* Point Utilization */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700">Puan Kullanım Oranı</span>
                <span className="text-sm font-medium text-gray-900">
                  %{pointUtilization.toFixed(1)}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{
                    width: `${pointUtilization || 0}%`
                  }}
                />
              </div>
            </div>

            {/* Retention Rate */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700">Müşteri Tutma Oranı</span>
                <span className="text-sm font-medium text-gray-900">
                  %{segment.retentionRate.toFixed(1)}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full transition-all"
                  style={{
                    width: `${segment.retentionRate || 0}%`
                  }}
                />
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="text-sm">
                <span className="text-gray-600">Ortalama Harcama:</span>
                <div className="font-semibold text-gray-900">
                  {segment.averageSpending.toFixed(0)}₺
                </div>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Kampanya Katılım:</span>
                <div className="font-semibold text-gray-900">
                  %{segment.campaignParticipation.toFixed(1)}
                </div>
              </div>
            </div>

            {/* Top Products */}
            {segment.topProducts.length > 0 && (
              <div className="pt-2">
                <span className="text-sm text-gray-600">En Çok Satan Ürünler:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {segment.topProducts.slice(0, 3).map((product, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {product}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderSegmentMigration = () => {
    if (!data?.segmentMigration.length) return null

    return (
      <div className="space-y-2 mt-4">
        <h4 className="font-medium text-gray-700 flex items-center gap-2">
          <ArrowRight className="w-4 h-4" />
          Segment Geçişleri
        </h4>
        
        {data.segmentMigration.slice(0, 3).map((migration, index) => (
          <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded text-sm">
            <span className="text-gray-700">{migration.from}</span>
            <ArrowRight className="w-3 h-3 text-gray-400" />
            <span className="text-gray-700">{migration.to}</span>
            <Badge variant="outline" className="ml-auto text-xs">
              {migration.count} müşteri
            </Badge>
          </div>
        ))}
      </div>
    )
  }

  return (
    <BaseWidget
      title="🎯 Segment Performansı"
      description="Müşteri segmentlerinin detaylı performans analizi"
      loading={loading || isLoading}
      error={error}
      headerIcon={<Target className="w-5 h-5 text-indigo-600" />}
      actions={{
        onRefresh: fetchSegmentPerformance,
        onExport: () => console.log('Export segment performance'),
      }}
    >
      <div className="space-y-4">
        {data && renderSegmentOverview()}
        
        <div className="space-y-3">
          {data?.segments.map(segment => renderSegmentCard(segment))}
        </div>

        {data?.segments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Bu dönemde segment verisi bulunamadı</p>
          </div>
        )}

        {data && renderSegmentMigration()}

      </div>
    </BaseWidget>
  )
}