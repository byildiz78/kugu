'use client'

import { useState, useEffect } from 'react'
import { BaseWidget } from './base/BaseWidget'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Trophy, 
  Target, 
  TrendingUp,
  DollarSign,
  Users,
  Star,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Campaign {
  id: string
  name: string
  type: string
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'DRAFT'
  startDate: string
  endDate: string
  participantCount: number
  totalSpent: number
  pointsDistributed: number
  conversionRate: number
  roi: number
  engagement: number
  averageOrderValue: number
  repeatPurchaseRate: number
}

interface CampaignPerformanceWidgetProps {
  dateRange: {
    start: Date
    end: Date
  }
  loading?: boolean
}

export function CampaignPerformanceWidget({ dateRange, loading }: CampaignPerformanceWidgetProps) {
  const [data, setData] = useState<{
    campaigns: Campaign[]
    overview: {
      totalCampaigns: number
      activeCampaigns: number
      averageROI: number
      totalParticipants: number
      totalSpent: number
    }
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()

  const fetchCampaignPerformance = async () => {
    try {
      setIsLoading(true)
      setError(undefined)
      
      const params = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString()
      })

      const response = await fetch(`/api/analytics/campaigns?${params}`)
      if (!response.ok) throw new Error('Failed to fetch campaign performance')
      
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching campaign performance:', error)
      setError('Kampanya verileri yüklenirken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaignPerformance()
  }, [dateRange])

  const getStatusIcon = (status: Campaign['status']) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'PAUSED':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'COMPLETED':
        return <Trophy className="w-4 h-4 text-blue-500" />
      case 'DRAFT':
        return <AlertCircle className="w-4 h-4 text-gray-400" />
      default:
        return null
    }
  }

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      case 'DRAFT':
        return 'bg-gray-100 text-gray-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const getStatusLabel = (status: Campaign['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'Aktif'
      case 'PAUSED':
        return 'Duraklatılmış'
      case 'COMPLETED':
        return 'Tamamlandı'
      case 'DRAFT':
        return 'Taslak'
      default:
        return status
    }
  }

  const renderCampaignList = (campaigns: Campaign[]) => {
    return (
      <div className="space-y-3">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(campaign.status)}
                  <h4 className="font-medium text-gray-900 truncate">
                    {campaign.name}
                  </h4>
                  <Badge className={cn('text-xs', getStatusColor(campaign.status))}>
                    {getStatusLabel(campaign.status)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-gray-600">{campaign.participantCount.toLocaleString('tr-TR')} katılımcı</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className="text-gray-600">{campaign.totalSpent.toFixed(0)}₺</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-500" />
                    <span className="text-gray-600">%{campaign.conversionRate.toFixed(1)} dönüşüm</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                    <span className={cn(
                      'font-medium',
                      campaign.roi > 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {campaign.roi.toFixed(1)}x ROI
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">
                  {campaign.pointsDistributed.toLocaleString('tr-TR')}
                </div>
                <div className="text-xs text-gray-500">
                  Dağıtılan puan
                </div>
              </div>
            </div>
          </Card>
        ))}

        {campaigns.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Bu dönemde kampanya bulunamadı</p>
          </div>
        )}
      </div>
    )
  }

  const renderOverviewStats = () => {
    if (!data?.overview) return null

    const stats = [
      {
        label: 'Toplam Kampanya',
        value: data.overview.totalCampaigns,
        icon: Activity,
        color: 'text-blue-600'
      },
      {
        label: 'Aktif Kampanya',
        value: data.overview.activeCampaigns,
        icon: CheckCircle,
        color: 'text-green-600'
      },
      {
        label: 'Ortalama ROI',
        value: `${data.overview.averageROI.toFixed(1)}x`,
        icon: TrendingUp,
        color: 'text-purple-600'
      },
      {
        label: 'Toplam Katılım',
        value: data.overview.totalParticipants.toLocaleString('tr-TR'),
        icon: Users,
        color: 'text-orange-600'
      }
    ]

    return (
      <div className="grid grid-cols-2 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center p-3 bg-gray-50 rounded-lg">
            <stat.icon className={cn('w-5 h-5 mx-auto mb-1', stat.color)} />
            <div className="text-lg font-semibold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <BaseWidget
      title="Kampanya Performansı"
      description="Sadakat kampanyalarının detaylı analizi"
      loading={loading || isLoading}
      error={error}
      headerIcon={<Trophy className="w-5 h-5 text-purple-600" />}
      actions={{
        onRefresh: fetchCampaignPerformance,
        onExport: () => console.log('Export campaign performance'),
      }}
    >
      <div className="space-y-4">
        {data && renderOverviewStats()}

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">
              Tümü
            </TabsTrigger>
            <TabsTrigger value="active">
              Aktif
            </TabsTrigger>
            <TabsTrigger value="completed">
              Tamamlandı
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            {data?.campaigns && renderCampaignList(data.campaigns)}
          </TabsContent>
          
          <TabsContent value="active" className="mt-4">
            {data?.campaigns && renderCampaignList(
              data.campaigns.filter(c => c.status === 'ACTIVE')
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="mt-4">
            {data?.campaigns && renderCampaignList(
              data.campaigns.filter(c => c.status === 'COMPLETED')
            )}
          </TabsContent>
        </Tabs>

      </div>
    </BaseWidget>
  )
}