'use client'

import { useState, useEffect } from 'react'
import { MobileContainer } from '@/components/mobile/layout/MobileContainer'
import { ThemedCard } from '@/components/mobile/ui/ThemedCard' 
import { ThemedButton } from '@/components/mobile/ui/ThemedButton'
import { AuthProvider, useAuth } from '@/lib/mobile/auth-context'
import { ThemeProvider } from '@/lib/mobile/theme-context'
import { 
  Clock, 
  Search, 
  Filter, 
  Calendar,
  Star,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Gift,
  CreditCard,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { format, startOfDay, endOfDay, subDays, subMonths } from 'date-fns'
import { tr } from 'date-fns/locale'

interface Transaction {
  id: string
  type: 'PURCHASE' | 'POINTS_EARNED' | 'POINTS_REDEEMED' | 'CAMPAIGN_USED' | 'REWARD_CLAIMED'
  amount?: number
  points: number
  description: string
  date: string
  status: 'COMPLETED' | 'PENDING' | 'FAILED'
  relatedId?: string
  relatedName?: string
}

function HistoryContent() {
  const { customer } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'earned' | 'spent' | 'purchases'>('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')

  useEffect(() => {
    if (customer?.id) {
      fetchTransactions()
    }
  }, [customer, dateFilter])

  const fetchTransactions = async () => {
    try {
      // Build query parameters
      const params = new URLSearchParams({
        customerId: customer?.id || '',
        limit: '50' // Get more transactions for mobile
      })

      // Add date filter if selected
      if (dateFilter === 'today') {
        const today = new Date()
        params.append('startDate', today.toISOString())
        params.append('endDate', today.toISOString())
      } else if (dateFilter === 'week') {
        const weekAgo = subDays(new Date(), 7)
        params.append('startDate', weekAgo.toISOString())
      } else if (dateFilter === 'month') {
        const monthAgo = subMonths(new Date(), 1)
        params.append('startDate', monthAgo.toISOString())
      }

      const response = await fetch(`/api/transactions?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_BEARER_TOKEN}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        
        // Transform API transactions to mobile format
        const transformedTransactions: Transaction[] = data.transactions.map((t: any) => {
          // Determine transaction type and points
          let type: Transaction['type'] = 'PURCHASE'
          let points = t.pointsEarned || 0
          let description = `Restoran alışverişi - ${t.orderNumber}`

          // Check if points were used in the transaction
          if (t.pointsUsed > 0) {
            points = -t.pointsUsed
            type = 'POINTS_REDEEMED'
            description = `Puan kullanımı - ${t.orderNumber}`
          }

          // Check for campaign usage
          if (t.appliedCampaigns && t.appliedCampaigns.length > 0) {
            const campaign = t.appliedCampaigns[0]
            type = 'CAMPAIGN_USED'
            description = `${campaign.campaign.name} - ${t.orderNumber}`
          }

          return {
            id: t.id,
            type,
            amount: t.finalAmount,
            points,
            description,
            date: t.transactionDate,
            status: t.status || 'COMPLETED',
            relatedId: t.id,
            relatedName: t.orderNumber
          }
        })

        setTransactions(transformedTransactions)
      } else {
        console.error('Failed to fetch transactions:', response.statusText)
        // Fallback to empty array on error
        setTransactions([])
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
      // Fallback to empty array on error
      setTransactions([])
    } finally {
      setIsLoading(false)
    }
  }

  const getFilteredTransactions = () => {
    return transactions.filter(transaction => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.relatedName?.toLowerCase().includes(searchTerm.toLowerCase())

      // Type filter
      const matchesTypeFilter = selectedFilter === 'all' ||
        (selectedFilter === 'earned' && transaction.points > 0) ||
        (selectedFilter === 'spent' && transaction.points < 0) ||
        (selectedFilter === 'purchases' && transaction.type === 'PURCHASE')

      // Date filter
      const transactionDate = new Date(transaction.date)
      const now = new Date()
      const matchesDateFilter = dateFilter === 'all' ||
        (dateFilter === 'today' && transactionDate >= startOfDay(now) && transactionDate <= endOfDay(now)) ||
        (dateFilter === 'week' && transactionDate >= subDays(now, 7)) ||
        (dateFilter === 'month' && transactionDate >= subMonths(now, 1))

      return matchesSearch && matchesTypeFilter && matchesDateFilter
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'PURCHASE':
        return <ShoppingBag className="w-5 h-5" />
      case 'POINTS_EARNED':
        return <TrendingUp className="w-5 h-5" />
      case 'POINTS_REDEEMED':
      case 'REWARD_CLAIMED':
        return <Gift className="w-5 h-5" />
      case 'CAMPAIGN_USED':
        return <Star className="w-5 h-5" />
      default:
        return <CreditCard className="w-5 h-5" />
    }
  }

  const getTransactionColor = (type: string, points: number) => {
    if (points > 0) {
      return {
        icon: 'text-green-600',
        bg: 'bg-green-50',
        points: 'text-green-600'
      }
    } else {
      return {
        icon: 'text-red-600',
        bg: 'bg-red-50',
        points: 'text-red-600'
      }
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'PURCHASE':
        return 'Alışveriş'
      case 'POINTS_EARNED':
        return 'Puan Kazancı'
      case 'POINTS_REDEEMED':
        return 'Puan Kullanımı'
      case 'CAMPAIGN_USED':
        return 'Kampanya'
      case 'REWARD_CLAIMED':
        return 'Ödül'
      default:
        return 'İşlem'
    }
  }

  const filteredTransactions = getFilteredTransactions()

  const getFilterCount = (filter: string) => {
    return transactions.filter(transaction => {
      if (filter === 'all') return true
      if (filter === 'earned') return transaction.points > 0
      if (filter === 'spent') return transaction.points < 0
      if (filter === 'purchases') return transaction.type === 'PURCHASE'
      return false
    }).length
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary"></div>
      </div>
    )
  }

  return (
    <div className="px-4 pb-20 space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <ThemedCard className="text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            <ArrowUpRight className="w-5 h-5 text-green-600" />
            <Star className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-xl font-bold text-green-600 mb-1">
            +{transactions.filter(t => t.points > 0).reduce((sum, t) => sum + t.points, 0)}
          </div>
          <div className="text-sm text-theme-text-secondary">
            Kazanılan Puan
          </div>
        </ThemedCard>
        
        <ThemedCard className="text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            <ArrowDownRight className="w-5 h-5 text-red-600" />
            <Star className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-xl font-bold text-red-600 mb-1">
            {transactions.filter(t => t.points < 0).reduce((sum, t) => sum + Math.abs(t.points), 0)}
          </div>
          <div className="text-sm text-theme-text-secondary">
            Kullanılan Puan
          </div>
        </ThemedCard>
      </div>

      {/* Search and Filters */}
      <div className="sticky top-0 bg-theme-background pt-2 pb-2 z-10 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-text-secondary" />
          <Input
            placeholder="İşlem ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-theme-surface border-gray-200"
          />
        </div>

        {/* Type Filters */}
        <div className="flex gap-2 overflow-x-auto">
          <ThemedButton
            variant={selectedFilter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('all')}
            className="whitespace-nowrap"
          >
            Tümü ({getFilterCount('all')})
          </ThemedButton>
          
          <ThemedButton
            variant={selectedFilter === 'earned' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('earned')}
            className="whitespace-nowrap"
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Kazancı ({getFilterCount('earned')})
          </ThemedButton>
          
          <ThemedButton
            variant={selectedFilter === 'spent' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('spent')}
            className="whitespace-nowrap"
          >
            <TrendingDown className="w-4 h-4 mr-1" />
            Kullanım ({getFilterCount('spent')})
          </ThemedButton>
          
          <ThemedButton
            variant={selectedFilter === 'purchases' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('purchases')}
            className="whitespace-nowrap"
          >
            <ShoppingBag className="w-4 h-4 mr-1" />
            Alışveriş ({getFilterCount('purchases')})
          </ThemedButton>
        </div>

        {/* Date Filters */}
        <div className="flex gap-2 overflow-x-auto">
          <ThemedButton
            variant={dateFilter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setDateFilter('all')}
            className="whitespace-nowrap"
          >
            Tüm Zamanlar
          </ThemedButton>
          
          <ThemedButton
            variant={dateFilter === 'today' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setDateFilter('today')}
            className="whitespace-nowrap"
          >
            Bugün
          </ThemedButton>
          
          <ThemedButton
            variant={dateFilter === 'week' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setDateFilter('week')}
            className="whitespace-nowrap"
          >
            Son 7 Gün
          </ThemedButton>
          
          <ThemedButton
            variant={dateFilter === 'month' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setDateFilter('month')}
            className="whitespace-nowrap"
          >
            Son 30 Gün
          </ThemedButton>
        </div>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <ThemedCard className="text-center py-12">
          <Clock className="w-16 h-16 text-theme-text-disabled mx-auto mb-4" />
          <h3 className="font-semibold text-theme-text-primary mb-2">
            {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz işlem bulunmuyor'}
          </h3>
          <p className="text-theme-text-secondary text-sm">
            {searchTerm 
              ? 'Farklı bir anahtar kelime deneyin'
              : 'İlk alışverişinizi yaptığınızda burada görünecek'
            }
          </p>
          {searchTerm && (
            <ThemedButton
              variant="outline"
              size="sm"
              onClick={() => setSearchTerm('')}
              className="mt-4"
            >
              Aramayı Temizle
            </ThemedButton>
          )}
        </ThemedCard>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((transaction) => {
            const colors = getTransactionColor(transaction.type, transaction.points)
            
            return (
              <ThemedCard key={transaction.id}>
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center ${colors.icon}`}>
                    {getTransactionIcon(transaction.type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-theme-text-primary truncate">
                        {transaction.description}
                      </h3>
                      <div className="flex items-center gap-1">
                        <Star className={`w-4 h-4 ${colors.points}`} />
                        <span className={`font-semibold ${colors.points}`}>
                          {transaction.points > 0 ? '+' : ''}{transaction.points}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-theme-text-secondary">
                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                          {getTypeLabel(transaction.type)}
                        </span>
                        {transaction.relatedName && (
                          <span className="truncate">
                            {transaction.relatedName}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-theme-text-secondary">
                        {format(new Date(transaction.date), 'd MMM yyyy, HH:mm', { locale: tr })}
                      </span>
                      {transaction.amount && (
                        <span className="text-sm font-medium text-theme-text-primary">
                          {transaction.amount.toFixed(2)} ₺
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </ThemedCard>
            )
          })}
        </div>
      )}

      {/* Load More Button */}
      {filteredTransactions.length >= 8 && (
        <ThemedCard className="text-center">
          <ThemedButton variant="outline" className="w-full">
            Daha Fazla Yükle
          </ThemedButton>
        </ThemedCard>
      )}
    </div>
  )
}

export default function HistoryPage() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <MobileContainer title="İşlem Geçmişi" showBack showNotifications>
          <HistoryContent />
        </MobileContainer>
      </ThemeProvider>
    </AuthProvider>
  )
}