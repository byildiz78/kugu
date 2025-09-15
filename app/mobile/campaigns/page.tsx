'use client'

import { useState, useEffect } from 'react'
import { MobileContainer } from '@/components/mobile/layout/MobileContainer'
import { CampaignCard } from '@/components/mobile/cards/CampaignCard'
import { AuthProvider, useAuth } from '@/lib/mobile/auth-context'
import { ThemeProvider, useTheme } from '@/lib/mobile/theme-context'
import { ThemedCard } from '@/components/mobile/ui/ThemedCard'
import { ThemedButton } from '@/components/mobile/ui/ThemedButton'
import { Search, Filter, Tag, Clock, TrendingUp } from 'lucide-react'

interface Campaign {
  id: string
  name: string
  description: string
  type: string
  discountType?: string
  discountValue?: number
  startDate: string
  endDate: string
  isActive: boolean
  usageCount?: number
  maxUsagePerCustomer?: number
  _count?: {
    usages: number
  }
}

function CampaignsContent() {
  const { customer } = useAuth()
  const { theme } = useTheme()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'discount' | 'points'>('all')

  useEffect(() => {
    if (customer?.id) {
      fetchCampaigns()
    }
  }, [customer])

  const fetchCampaigns = async () => {
    try {
      const response = await fetch(`/api/customers/${customer?.id}`, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_BEARER_TOKEN}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.availableCampaigns || [])
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredCampaigns = campaigns.filter(campaign => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchTerm.toLowerCase())

    // Type filter
    const matchesFilter = selectedFilter === 'all' || 
      (selectedFilter === 'active' && campaign.isActive) ||
      (selectedFilter === 'discount' && (campaign.type === 'DISCOUNT' || campaign.type === 'CATEGORY_DISCOUNT')) ||
      (selectedFilter === 'points' && campaign.type === 'LOYALTY_POINTS')

    return matchesSearch && matchesFilter
  })

  const getFilterCount = (filter: string) => {
    return campaigns.filter(campaign => {
      if (filter === 'all') return true
      if (filter === 'active') return campaign.isActive
      if (filter === 'discount') return campaign.type === 'DISCOUNT' || campaign.type === 'CATEGORY_DISCOUNT'
      if (filter === 'points') return campaign.type === 'LOYALTY_POINTS'
      return false
    }).length
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div 
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderBottomColor: theme.primary }}
        ></div>
      </div>
    )
  }

  return (
    <div className="px-4 pb-20 space-y-6 relative">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div 
          className="absolute top-10 right-4 w-32 h-32 rounded-full opacity-5"
          style={{ backgroundColor: theme.primary }}
        />
        <div 
          className="absolute top-40 left-4 w-20 h-20 rounded-full opacity-3"
          style={{ backgroundColor: theme.accent }}
        />
        <div 
          className="absolute bottom-32 right-8 w-16 h-16 rounded-full opacity-4"
          style={{ backgroundColor: theme.secondary }}
        />
      </div>

      {/* Enhanced Stats Header */}
      <div 
        className="relative overflow-hidden rounded-3xl p-6 text-white shadow-2xl animate-fade-in-scale"
        style={{ 
          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
          boxShadow: `0 20px 40px ${theme.primary}30`
        }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white animate-float"></div>
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white animate-float" style={{ animationDelay: '1s', animationDirection: 'reverse' }}></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Aktif Kampanyalar</h2>
              <p className="text-white/80 text-sm">Kaçırılmayacak fırsatlar</p>
            </div>
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl animate-float">
              <Tag className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mb-2">
                <p className="text-3xl font-black">{campaigns.length}</p>
              </div>
              <p className="text-white/80 text-sm font-medium">Toplam</p>
            </div>
            
            <div className="text-center">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mb-2">
                <p className="text-3xl font-black text-green-300">
                  {campaigns.filter(c => c.isActive && new Date(c.endDate) > new Date()).length}
                </p>
              </div>
              <p className="text-white/80 text-sm font-medium">Aktif</p>
            </div>
            
            <div className="text-center">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mb-2">
                <p className="text-3xl font-black text-yellow-300">
                  {campaigns.reduce((acc, c) => acc + (c._count?.usages || 0), 0)}
                </p>
              </div>
              <p className="text-white/80 text-sm font-medium">Kullanım</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Search */}
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
            placeholder="Kampanya ara..."
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
            <Tag className="w-4 h-4" />
            <span>Tümü</span>
            <div 
              className="px-2 py-1 rounded-full text-xs font-bold"
              style={{
                backgroundColor: selectedFilter === 'all' ? 'rgba(255,255,255,0.2)' : theme.primary,
                color: 'white'
              }}
            >
              {getFilterCount('all')}
            </div>
          </button>
          
          <button
            onClick={() => setSelectedFilter('active')}
            className={`flex items-center space-x-2 px-4 py-3 rounded-2xl font-semibold text-sm whitespace-nowrap transition-all duration-300 transform ${
              selectedFilter === 'active' ? 'scale-105 shadow-lg' : 'hover:scale-102'
            }`}
            style={{
              backgroundColor: selectedFilter === 'active' ? theme.success : theme.surface,
              color: selectedFilter === 'active' ? 'white' : theme.textPrimary,
              border: selectedFilter === 'active' ? 'none' : `2px solid ${theme.success}20`
            }}
          >
            <Clock className="w-4 h-4" />
            <span>Aktif</span>
            <div 
              className="px-2 py-1 rounded-full text-xs font-bold"
              style={{
                backgroundColor: selectedFilter === 'active' ? 'rgba(255,255,255,0.2)' : theme.success,
                color: 'white'
              }}
            >
              {getFilterCount('active')}
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
                backgroundColor: selectedFilter === 'discount' ? 'rgba(255,255,255,0.2)' : theme.warning,
                color: 'white'
              }}
            >
              {getFilterCount('discount')}
            </div>
          </button>
          
          <button
            onClick={() => setSelectedFilter('points')}
            className={`flex items-center space-x-2 px-4 py-3 rounded-2xl font-semibold text-sm whitespace-nowrap transition-all duration-300 transform ${
              selectedFilter === 'points' ? 'scale-105 shadow-lg' : 'hover:scale-102'
            }`}
            style={{
              backgroundColor: selectedFilter === 'points' ? theme.accent : theme.surface,
              color: selectedFilter === 'points' ? 'white' : theme.textPrimary,
              border: selectedFilter === 'points' ? 'none' : `2px solid ${theme.accent}20`
            }}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Puan</span>
            <div 
              className="px-2 py-1 rounded-full text-xs font-bold"
              style={{
                backgroundColor: selectedFilter === 'points' ? 'rgba(255,255,255,0.2)' : theme.accent,
                color: 'white'
              }}
            >
              {getFilterCount('points')}
            </div>
          </button>
        </div>
      </div>

      {/* Campaigns List */}
      {filteredCampaigns.length === 0 ? (
        <ThemedCard className="text-center py-12">
          <Tag className="w-16 h-16 text-theme-text-disabled mx-auto mb-4" />
          <h3 className="font-semibold text-theme-text-primary mb-2">
            {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz kampanya bulunmuyor'}
          </h3>
          <p className="text-theme-text-secondary text-sm">
            {searchTerm 
              ? 'Farklı bir anahtar kelime deneyin'
              : 'Yeni kampanyalar eklendiğinde burada görünecek'
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
          {filteredCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              id={campaign.id}
              name={campaign.name}
              description={campaign.description}
              type={campaign.type}
              discountType={campaign.discountType}
              discountValue={campaign.discountValue}
              endDate={campaign.endDate}
              isActive={campaign.isActive}
              usageCount={campaign.usageCount || 0}
              maxUsagePerCustomer={campaign.maxUsagePerCustomer || 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function CampaignsPage() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <MobileContainer title="Kampanyalar" showBack showNotifications>
          <CampaignsContent />
        </MobileContainer>
      </ThemeProvider>
    </AuthProvider>
  )
}