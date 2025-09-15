'use client'

import { useState, useEffect } from 'react'
import { BaseWidget } from './base/BaseWidget'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Crown, 
  DollarSign, 
  ShoppingBag, 
  Star,
  TrendingUp,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TopCustomer {
  id: string
  name: string
  email: string
  totalSpent: number
  totalTransactions: number
  pointsUsed: number
  pointsEarned: number
  tier?: {
    name: string
    color: string
    displayName: string
  }
  lastPurchase: string
  growthRate: number
}

interface TopCustomersWidgetProps {
  dateRange: {
    start: Date
    end: Date
  }
  loading?: boolean
}

export function TopCustomersWidget({ dateRange, loading }: TopCustomersWidgetProps) {
  const [data, setData] = useState<{
    topBySpending: TopCustomer[]
    topByTransactions: TopCustomer[]
    topByPoints: TopCustomer[]
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()

  const fetchTopCustomers = async () => {
    try {
      setIsLoading(true)
      setError(undefined)
      
      const params = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString()
      })

      const response = await fetch(`/api/analytics/customers?${params}`)
      if (!response.ok) throw new Error('Failed to fetch top customers')
      
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching top customers:', error)
      setError('Veriler yüklenirken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTopCustomers()
  }, [dateRange])

  const renderCustomerList = (customers: TopCustomer[], type: 'spending' | 'transactions' | 'points') => {
    const getValueDisplay = (customer: TopCustomer) => {
      switch (type) {
        case 'spending':
          return `${customer.totalSpent.toFixed(0)}₺`
        case 'transactions':
          return `${customer.totalTransactions} işlem`
        case 'points':
          return `${customer.pointsUsed} puan`
        default:
          return ''
      }
    }

    const getIcon = () => {
      switch (type) {
        case 'spending': return DollarSign
        case 'transactions': return ShoppingBag
        case 'points': return Star
        default: return Users
      }
    }

    const Icon = getIcon()

    return (
      <div className="space-y-3">
        {customers.map((customer, index) => (
          <div
            key={customer.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
          >
            {/* Rank */}
            <div className="flex-shrink-0">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                index === 0 ? 'bg-yellow-100 text-yellow-800' :
                index === 1 ? 'bg-gray-100 text-gray-600' :
                index === 2 ? 'bg-orange-100 text-orange-600' :
                'bg-blue-50 text-blue-600'
              )}>
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
              </div>
            </div>

            {/* Avatar */}
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-sm">
                {customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Customer Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900 truncate">
                  {customer.name}
                </p>
                {customer.tier && (
                  <Badge 
                    className="text-xs"
                    style={{ 
                      backgroundColor: `${customer.tier.color}20`, 
                      color: customer.tier.color 
                    }}
                  >
                    <Crown className="w-3 h-3 mr-1" />
                    {customer.tier.displayName}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 truncate">
                {customer.email}
              </p>
            </div>

            {/* Value & Growth */}
            <div className="text-right">
              <div className="flex items-center gap-1">
                <Icon className="w-4 h-4 text-gray-400" />
                <span className="font-semibold text-gray-900">
                  {getValueDisplay(customer)}
                </span>
              </div>
              {customer.growthRate !== 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp 
                    className={cn(
                      'w-3 h-3',
                      customer.growthRate > 0 ? 'text-green-500' : 'text-red-500'
                    )} 
                  />
                  <span 
                    className={cn(
                      'text-xs',
                      customer.growthRate > 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {customer.growthRate > 0 ? '+' : ''}{customer.growthRate.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

        {customers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Bu dönemde veri bulunamadı</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <BaseWidget
      title="En İyi Müşteriler"
      description="Farklı kategorilerde öne çıkan müşteriler"
      loading={loading || isLoading}
      error={error}
      headerIcon={<Crown className="w-5 h-5 text-yellow-600" />}
      actions={{
        onRefresh: fetchTopCustomers,
        onExport: () => console.log('Export top customers'),
      }}
    >
      <Tabs defaultValue="spending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="spending">
            Harcama
          </TabsTrigger>
          <TabsTrigger value="transactions">
            İşlem
          </TabsTrigger>
          <TabsTrigger value="points">
            Puan
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="spending" className="mt-4">
          {data?.topBySpending && renderCustomerList(data.topBySpending, 'spending')}
        </TabsContent>
        
        <TabsContent value="transactions" className="mt-4">
          {data?.topByTransactions && renderCustomerList(data.topByTransactions, 'transactions')}
        </TabsContent>
        
        <TabsContent value="points" className="mt-4">
          {data?.topByPoints && renderCustomerList(data.topByPoints, 'points')}
        </TabsContent>
      </Tabs>

    </BaseWidget>
  )
}