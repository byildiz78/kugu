'use client'

import { useState, useEffect } from 'react'
import { MobileContainer } from '@/components/mobile/layout/MobileContainer'
import { RewardCard } from '@/components/mobile/cards/RewardCard'
import { AuthProvider, useAuth } from '@/lib/mobile/auth-context'
import { ThemeProvider, useTheme } from '@/lib/mobile/theme-context'
import { ThemedCard } from '@/components/mobile/ui/ThemedCard'
import { ThemedButton } from '@/components/mobile/ui/ThemedButton'
import { Search, Filter, Gift, Star, TrendingUp, Zap } from 'lucide-react'

interface Reward {
  id: string
  name: string
  description: string
  type: string
  category?: string
  pointsCost: number
  value?: number
  isAvailable: boolean
  expiresAt?: string
  imageUrl?: string
  source?: string
  earnedAt?: string
}

function RewardsContent() {
  const { customer } = useAuth()
  const { theme } = useTheme()
  const [rewards, setRewards] = useState<Reward[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'affordable' | 'discount' | 'voucher' | 'free_product'>('all')

  useEffect(() => {
    if (customer?.id) {
      fetchRewards()
    }
  }, [customer])

  const fetchRewards = async () => {
    try {
      const response = await fetch(`/api/mobile/rewards?customerId=${customer?.id}`, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_BEARER_TOKEN}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setRewards(data.rewards || [])
      } else {
        throw new Error(`API Error: ${response.status}`)
      }
    } catch (error) {
      console.error('Failed to fetch rewards:', error)
      // Set empty array on error - no more demo data
      setRewards([])
    } finally {
      setIsLoading(false)
    }
  }


  const filteredRewards = rewards.filter(reward => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      reward.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reward.description.toLowerCase().includes(searchTerm.toLowerCase())

    // Type filter
    const customerPoints = customer?.points || 0
    const matchesFilter = selectedFilter === 'all' || 
      (selectedFilter === 'affordable' && customerPoints >= reward.pointsCost) ||
      (selectedFilter === 'discount' && reward.type === 'DISCOUNT') ||
      (selectedFilter === 'voucher' && reward.type === 'VOUCHER') ||
      (selectedFilter === 'free_product' && reward.type === 'FREE_PRODUCT')

    return matchesSearch && matchesFilter
  })

  const getFilterCount = (filter: string) => {
    const customerPoints = customer?.points || 0
    return rewards.filter(reward => {
      if (filter === 'all') return true
      if (filter === 'affordable') return customerPoints >= reward.pointsCost
      if (filter === 'discount') return reward.type === 'DISCOUNT'
      if (filter === 'voucher') return reward.type === 'VOUCHER'
      if (filter === 'free_product') return reward.type === 'FREE_PRODUCT'
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
    <div className="px-4 pb-20 space-y-6 relative">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div 
          className="absolute top-10 right-4 w-20 h-20 rounded-full opacity-5"
          style={{ backgroundColor: theme.accent }}
        />
        <div 
          className="absolute top-32 left-4 w-12 h-12 rounded-full opacity-3"
          style={{ backgroundColor: theme.secondary }}
        />
      </div>

      {/* Enhanced Points Summary */}
      <div 
        className="relative overflow-hidden rounded-3xl p-6 text-white shadow-2xl animate-fade-in-scale"
        style={{ 
          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`,
          boxShadow: `0 20px 40px ${theme.primary}30`
        }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white"></div>
          <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white"></div>
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">Puanlarınız</h2>
            <p className="text-white/80 text-sm">Harika ödüllerle değiştirin</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="p-2 rounded-full bg-white/20 backdrop-blur-sm animate-float"
                style={{ animationDelay: '0.5s' }}
              >
                <Star className="w-6 h-6 text-white" />
              </div>
              <span className="text-4xl font-black">
                {customer?.points?.toLocaleString('tr-TR') || '0'}
              </span>
            </div>
            <p className="text-white/80 text-sm font-medium">mevcut puan</p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mt-4">
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-1000 ease-out animate-gradient-shift"
              style={{ width: '65%' }}
            />
          </div>
          <p className="text-xs text-white/70 mt-2">
            Bir sonraki seviyeye %35 kaldı
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="sticky top-0 bg-theme-background pt-2 pb-2 z-10">
        <div className="relative">
          <div 
            className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-full"
            style={{ backgroundColor: `${theme.primary}20` }}
          >
            <Search className="h-4 w-4" style={{ color: theme.primary }} />
          </div>
          <input
            type="text"
            placeholder="Ödül ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 h-12 rounded-2xl shadow-lg font-medium text-theme-text-primary placeholder-theme-text-secondary bg-theme-surface focus:outline-none focus:ring-2 transition-all duration-300"
            style={{ 
              borderWidth: '2px',
              borderColor: `${theme.primary}20`
            }}
            onFocus={(e) => {
              e.target.style.borderColor = theme.primary
              e.target.style.boxShadow = `0 0 0 3px ${theme.primary}20`
            }}
            onBlur={(e) => {
              e.target.style.borderColor = `${theme.primary}20`
              e.target.style.boxShadow = ''
            }}
          />
        </div>

        {/* Enhanced Filter Tabs */}
        <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`flex items-center space-x-2 px-4 py-3 rounded-2xl font-semibold text-sm whitespace-nowrap transition-all duration-300 transform ${
              selectedFilter === 'all' ? 'scale-105 shadow-lg' : 'hover:scale-102'
            }`}
            style={{
              backgroundColor: selectedFilter === 'all' ? theme.primary : theme.surface,
              color: selectedFilter === 'all' ? 'white' : theme.textPrimary,
              border: selectedFilter === 'all' ? 'none' : `2px solid ${theme.primary}20`
            }}
          >
            <Gift className="w-4 h-4" />
            <span>Tümü</span>
            <div 
              className="px-2 py-1 rounded-full text-xs font-bold"
              style={{
                backgroundColor: selectedFilter === 'all' ? 'rgba(255,255,255,0.2)' : theme.accent,
                color: selectedFilter === 'all' ? 'white' : 'white'
              }}
            >
              {getFilterCount('all')}
            </div>
          </button>
          
          <button
            onClick={() => setSelectedFilter('affordable')}
            className={`flex items-center space-x-2 px-4 py-3 rounded-2xl font-semibold text-sm whitespace-nowrap transition-all duration-300 transform ${
              selectedFilter === 'affordable' ? 'scale-105 shadow-lg' : 'hover:scale-102'
            }`}
            style={{
              backgroundColor: selectedFilter === 'affordable' ? theme.success : theme.surface,
              color: selectedFilter === 'affordable' ? 'white' : theme.textPrimary,
              border: selectedFilter === 'affordable' ? 'none' : `2px solid ${theme.success}20`
            }}
          >
            <Zap className="w-4 h-4" />
            <span>Alabilirsiniz</span>
            <div 
              className="px-2 py-1 rounded-full text-xs font-bold"
              style={{
                backgroundColor: selectedFilter === 'affordable' ? 'rgba(255,255,255,0.2)' : theme.accent,
                color: selectedFilter === 'affordable' ? 'white' : 'white'
              }}
            >
              {getFilterCount('affordable')}
            </div>
          </button>
          
          <button
            onClick={() => setSelectedFilter('discount')}
            className={`flex items-center space-x-2 px-4 py-3 rounded-2xl font-semibold text-sm whitespace-nowrap transition-all duration-300 transform ${
              selectedFilter === 'discount' ? 'scale-105 shadow-lg' : 'hover:scale-102'
            }`}
            style={{
              backgroundColor: selectedFilter === 'discount' ? theme.warning : theme.surface,
              color: selectedFilter === 'discount' ? 'white' : theme.textPrimary,
              border: selectedFilter === 'discount' ? 'none' : `2px solid ${theme.warning}20`
            }}
          >
            <span>İndirim</span>
            <div 
              className="px-2 py-1 rounded-full text-xs font-bold"
              style={{
                backgroundColor: selectedFilter === 'discount' ? 'rgba(255,255,255,0.2)' : theme.accent,
                color: selectedFilter === 'discount' ? 'white' : 'white'
              }}
            >
              {getFilterCount('discount')}
            </div>
          </button>
          
          <button
            onClick={() => setSelectedFilter('voucher')}
            className={`flex items-center space-x-2 px-4 py-3 rounded-2xl font-semibold text-sm whitespace-nowrap transition-all duration-300 transform ${
              selectedFilter === 'voucher' ? 'scale-105 shadow-lg' : 'hover:scale-102'
            }`}
            style={{
              backgroundColor: selectedFilter === 'voucher' ? theme.secondary : theme.surface,
              color: selectedFilter === 'voucher' ? 'white' : theme.textPrimary,
              border: selectedFilter === 'voucher' ? 'none' : `2px solid ${theme.secondary}20`
            }}
          >
            <span>Hediye</span>
            <div 
              className="px-2 py-1 rounded-full text-xs font-bold"
              style={{
                backgroundColor: selectedFilter === 'voucher' ? 'rgba(255,255,255,0.2)' : theme.accent,
                color: selectedFilter === 'voucher' ? 'white' : 'white'
              }}
            >
              {getFilterCount('voucher')}
            </div>
          </button>
          
          <button
            onClick={() => setSelectedFilter('free_product')}
            className={`flex items-center space-x-2 px-4 py-3 rounded-2xl font-semibold text-sm whitespace-nowrap transition-all duration-300 transform ${
              selectedFilter === 'free_product' ? 'scale-105 shadow-lg' : 'hover:scale-102'
            }`}
            style={{
              backgroundColor: selectedFilter === 'free_product' ? theme.accent : theme.surface,
              color: selectedFilter === 'free_product' ? 'white' : theme.textPrimary,
              border: selectedFilter === 'free_product' ? 'none' : `2px solid ${theme.accent}20`
            }}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Bedava</span>
            <div 
              className="px-2 py-1 rounded-full text-xs font-bold"
              style={{
                backgroundColor: selectedFilter === 'free_product' ? 'rgba(255,255,255,0.2)' : theme.accent,
                color: selectedFilter === 'free_product' ? 'white' : 'white'
              }}
            >
              {getFilterCount('free_product')}
            </div>
          </button>
        </div>
      </div>

      {/* Rewards List */}
      {filteredRewards.length === 0 ? (
        <ThemedCard className="text-center py-12">
          <Gift className="w-16 h-16 text-theme-text-disabled mx-auto mb-4" />
          <h3 className="font-semibold text-theme-text-primary mb-2">
            {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz ödül bulunmuyor'}
          </h3>
          <p className="text-theme-text-secondary text-sm">
            {searchTerm 
              ? 'Farklı bir anahtar kelime deneyin'
              : 'Yeni ödüller eklendiğinde burada görünecek'
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
          {filteredRewards.map((reward) => (
            <RewardCard
              key={reward.id}
              id={reward.id}
              name={reward.name}
              description={reward.description}
              type={reward.type}
              category={reward.category}
              pointsCost={reward.pointsCost}
              value={reward.value}
              isAvailable={reward.isAvailable}
              customerPoints={customer?.points || 0}
              expiresAt={reward.expiresAt}
              imageUrl={reward.imageUrl}
              source={reward.source}
              earnedAt={reward.earnedAt}
            />
          ))}
        </div>
      )}

      {/* Earn More Points CTA */}
      {customer?.points !== undefined && customer.points < 100 && (
        <ThemedCard className="text-center">
          <Star className="w-12 h-12 text-theme-primary mx-auto mb-3" />
          <h3 className="font-semibold text-theme-text-primary mb-2">
            Daha Fazla Puan Kazanın
          </h3>
          <p className="text-sm text-theme-text-secondary mb-4">
            Alışveriş yaparak puan kazanın ve harika ödülleri keşfedin
          </p>
          <ThemedButton variant="primary" size="sm">
            Kampanyaları Görüntüle
          </ThemedButton>
        </ThemedCard>
      )}
    </div>
  )
}

export default function RewardsPage() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <MobileContainer title="Ödüller" showBack showNotifications>
          <RewardsContent />
        </MobileContainer>
      </ThemeProvider>
    </AuthProvider>
  )
}