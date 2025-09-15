'use client'

import { useState, useEffect } from 'react'
import { BaseWidget } from './base/BaseWidget'
// import { Progress } from '@/components/ui/progress' // Temporarily removed for build fix
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  Clock,
  ShoppingBag,
  Heart,
  TrendingUp,
  Calendar,
  MapPin,
  Smartphone,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CustomerBehaviorData {
  segmentDistribution: {
    segment: string
    count: number
    percentage: number
    averageSpending: number
    color: string
  }[]
  purchasePatterns: {
    timeOfDay: { hour: number, transactions: number }[]
    dayOfWeek: { day: string, transactions: number, dayIndex: number }[]
    monthlyTrend: { month: string, newCustomers: number, returningCustomers: number }[]
  }
  retentionMetrics: {
    newCustomers: number
    returningCustomers: number
    churnedCustomers: number
    retentionRate: number
    averageLifespan: number
    repeatPurchaseRate: number
  }
  channelPreferences: {
    channel: string
    users: number
    percentage: number
    averageOrderValue: number
  }[]
  demographicInsights: {
    ageGroups: { range: string, count: number, percentage: number }[]
    locations: { city: string, count: number, percentage: number }[]
    deviceTypes: { type: string, count: number, percentage: number }[]
  }
}

interface CustomerBehaviorWidgetProps {
  dateRange: {
    start: Date
    end: Date
  }
  loading?: boolean
}

export function CustomerBehaviorWidget({ dateRange, loading }: CustomerBehaviorWidgetProps) {
  const [data, setData] = useState<CustomerBehaviorData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()

  const fetchCustomerBehavior = async () => {
    try {
      setIsLoading(true)
      setError(undefined)
      
      const params = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString()
      })

      const response = await fetch(`/api/analytics/customer-behavior?${params}`)
      if (!response.ok) throw new Error('Failed to fetch customer behavior')
      
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching customer behavior:', error)
      setError('Müşteri davranışı verileri yüklenirken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomerBehavior()
  }, [dateRange])

  const renderSegmentDistribution = () => {
    if (!data?.segmentDistribution.length) return null

    return (
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Müşteri Segmentleri
        </h4>
        
        {data.segmentDistribution.map((segment) => (
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
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {segment.count.toLocaleString('tr-TR')}
                </span>
                <Badge variant="secondary" className="text-xs">
                  %{(segment.percentage || 0).toFixed(1)}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex-1">
                <div 
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${segment.percentage || 0}%`,
                    backgroundColor: segment.color
                  }}
                />
              </div>
              <span className="text-xs text-gray-500 min-w-[4rem]">
                {(segment.averageSpending || 0).toFixed(0)}₺ ort.
              </span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderRetentionMetrics = () => {
    if (!data?.retentionMetrics) return null

    const metrics = [
      {
        label: 'Yeni Müşteri',
        value: data.retentionMetrics.newCustomers.toLocaleString('tr-TR'),
        icon: Users,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      {
        label: 'Geri Dönen',
        value: data.retentionMetrics.returningCustomers.toLocaleString('tr-TR'),
        icon: Heart,
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      },
      {
        label: 'Tutma Oranı',
        value: `%${(data.retentionMetrics.retentionRate || 0).toFixed(1)}`,
        icon: TrendingUp,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
      },
      {
        label: 'Ortalama Ömür',
        value: `${data.retentionMetrics.averageLifespan} gün`,
        icon: Clock,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50'
      }
    ]

    return (
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700 flex items-center gap-2">
          <Heart className="w-4 h-4" />
          Sadakat Metrikleri
        </h4>
        
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((metric) => (
            <div key={metric.label} className={cn('p-3 rounded-lg', metric.bgColor)}>
              <div className="flex items-center gap-2 mb-1">
                <metric.icon className={cn('w-4 h-4', metric.color)} />
                <span className="text-xs text-gray-600">{metric.label}</span>
              </div>
              <div className="font-semibold text-gray-900">{metric.value}</div>
            </div>
          ))}
        </div>

        {/* Repeat Purchase Rate */}
        <div className="p-3 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Tekrar Satın Alma Oranı
            </span>
            <span className="text-sm font-bold text-indigo-600">
              %{(data.retentionMetrics.repeatPurchaseRate || 0).toFixed(1)}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 rounded-full transition-all"
              style={{
                width: `${data.retentionMetrics.repeatPurchaseRate || 0}%`
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  const renderChannelPreferences = () => {
    if (!data?.channelPreferences.length) return null

    return (
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700 flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          Kanal Tercihleri
        </h4>
        
        {data.channelPreferences.map((channel) => (
          <div key={channel.channel} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <div>
                <div className="font-medium text-gray-900 text-sm">
                  {channel.channel}
                </div>
                <div className="text-xs text-gray-600">
                  {channel.users.toLocaleString('tr-TR')} kullanıcı
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                %{(channel.percentage || 0).toFixed(1)}
              </div>
              <div className="text-xs text-gray-600">
                {(channel.averageOrderValue || 0).toFixed(0)}₺ ort.
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderDemographics = () => {
    if (!data?.demographicInsights) return null

    return (
      <Tabs defaultValue="age" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="age">
            Yaş
          </TabsTrigger>
          <TabsTrigger value="location">
            Konum
          </TabsTrigger>
          <TabsTrigger value="device">
            Cihaz
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="age" className="mt-4 space-y-2">
          {data.demographicInsights.ageGroups.map((age) => (
            <div key={age.range} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{age.range}</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${age.percentage}%` }}
                  />
                </div>
                <span className="text-gray-600 min-w-[3rem]">
                  %{(age.percentage || 0).toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </TabsContent>
        
        <TabsContent value="location" className="mt-4 space-y-2">
          {data.demographicInsights.locations.slice(0, 5).map((location) => (
            <div key={location.city} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 text-gray-400" />
                <span className="text-gray-700">{location.city}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">
                  {location.count.toLocaleString('tr-TR')}
                </span>
                <Badge variant="outline" className="text-xs">
                  %{(location.percentage || 0).toFixed(1)}
                </Badge>
              </div>
            </div>
          ))}
        </TabsContent>
        
        <TabsContent value="device" className="mt-4 space-y-2">
          {data.demographicInsights.deviceTypes.map((device) => (
            <div key={device.type} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-gray-700 text-sm">{device.type}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-green-500 h-1.5 rounded-full"
                    style={{ width: `${device.percentage}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600">
                  %{(device.percentage || 0).toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    )
  }

  return (
    <BaseWidget
      title="Müşteri Davranışı"
      description="Müşteri segmentleri ve satın alma davranışları"
      loading={loading || isLoading}
      error={error}
      headerIcon={<BarChart3 className="w-5 h-5 text-blue-600" />}
      actions={{
        onRefresh: fetchCustomerBehavior,
        onExport: () => console.log('Export customer behavior'),
      }}
    >
      <div className="space-y-6">
        {data && renderSegmentDistribution()}
        {data && renderRetentionMetrics()}
        {data && renderChannelPreferences()}
        {data && renderDemographics()}
      </div>
    </BaseWidget>
  )
}