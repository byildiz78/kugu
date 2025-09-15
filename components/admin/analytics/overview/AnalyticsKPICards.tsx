'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Star, 
  Activity,
  Target,
  BarChart3,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface KPIData {
  totalCustomers: number
  activeCustomers: number
  customerRetentionRate: number
  averageLifetimeValue: number
  totalPointsIssued: number
  totalPointsRedeemed: number
  pointBurnRate: number
  campaignROI: number
}

interface AnalyticsKPICardsProps {
  overview: KPIData
  loading?: boolean
}

export function AnalyticsKPICards({ overview, loading }: AnalyticsKPICardsProps) {
  const kpiCards = [
    {
      title: 'Toplam Müşteri',
      value: overview.totalCustomers.toLocaleString('tr-TR'),
      description: `${overview.activeCustomers} aktif müşteri`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      trend: {
        value: 12,
        isPositive: true,
        label: 'önceki aya göre'
      }
    },
    {
      title: 'Müşteri Tutma Oranı',
      value: `${overview.customerRetentionRate.toFixed(1)}%`,
      description: 'Son 3 aylık ortalama',
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      trend: {
        value: 8.2,
        isPositive: true,
        label: 'önceki döneme göre'
      }
    },
    {
      title: 'Ortalama Müşteri Değeri',
      value: `${overview.averageLifetimeValue.toFixed(0)}₺`,
      description: 'Lifetime value ortalaması',
      icon: DollarSign,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      trend: {
        value: 15.3,
        isPositive: true,
        label: 'artış'
      }
    },
    {
      title: 'Puan Yakma Oranı',
      value: `${overview.pointBurnRate.toFixed(1)}%`,
      description: `${Math.abs(overview.totalPointsRedeemed - overview.totalPointsIssued).toLocaleString('tr-TR')} puan aktif`,
      icon: Star,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      trend: {
        value: -2.1,
        isPositive: false,
        label: 'önceki aya göre'
      }
    },
    {
      title: 'Kampanya ROI',
      value: `${overview.campaignROI.toFixed(1)}x`,
      description: 'Ortalama yatırım getirisi',
      icon: BarChart3,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      trend: {
        value: 25.7,
        isPositive: true,
        label: 'gelişme'
      }
    },
    {
      title: 'Program Katılım',
      value: `${((overview.activeCustomers / overview.totalCustomers) * 100).toFixed(1)}%`,
      description: 'Aktif sadakat üyeliği',
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      trend: {
        value: 4.8,
        isPositive: true,
        label: 'artış'
      }
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {kpiCards.map((card, index) => (
        <Card 
          key={card.title} 
          className={cn(
            'relative overflow-hidden hover:shadow-lg transition-all duration-300 border-l-4',
            card.borderColor,
            'hover:scale-[1.02]'
          )}
        >
          {/* Background decoration */}
          <div className={cn('absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 opacity-10', card.bgColor)}>
            <div className="w-full h-full rounded-full"></div>
          </div>
          
          <CardHeader className="pb-3 relative z-10">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {card.title}
                </CardTitle>
                <div className="text-3xl font-bold text-gray-900">
                  {card.value}
                </div>
              </div>
              <div className={cn('p-3 rounded-xl', card.bgColor)}>
                <card.icon className={cn('h-6 w-6', card.color)} />
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <CardDescription className="flex items-center justify-between">
              <span>{card.description}</span>
              {card.trend && (
                <div className="flex items-center gap-1">
                  <TrendingUp 
                    className={cn(
                      'h-3 w-3',
                      card.trend.isPositive ? 'text-green-600' : 'text-red-600'
                    )} 
                  />
                  <span 
                    className={cn(
                      'text-xs font-medium',
                      card.trend.isPositive ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {card.trend.isPositive ? '+' : ''}{card.trend.value}%
                  </span>
                </div>
              )}
            </CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}