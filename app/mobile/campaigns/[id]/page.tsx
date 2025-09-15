'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MobileContainer } from '@/components/mobile/layout/MobileContainer'
import { ThemedCard } from '@/components/mobile/ui/ThemedCard'
import { ThemedButton } from '@/components/mobile/ui/ThemedButton'
import { QRCodeGenerator } from '@/components/mobile/ui/QRCodeGenerator'
import { AuthProvider, useAuth } from '@/lib/mobile/auth-context'
import { ThemeProvider } from '@/lib/mobile/theme-context'
import { 
  Tag, 
  Clock, 
  Users, 
  TrendingUp, 
  Gift, 
  Percent,
  Calendar,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'

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
  minPurchase?: number
  maxUsage?: number
  maxUsagePerCustomer?: number
  targetProducts?: string
  targetCategories?: string
  pointsMultiplier?: number
  _count?: {
    usages: number
  }
  usages?: Array<{
    id: string
    customerId: string
    usedAt: string
  }>
}

function CampaignDetailContent() {
  const params = useParams()
  const router = useRouter()
  const { customer } = useAuth()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUsing, setIsUsing] = useState(false)

  useEffect(() => {
    if (params.id && customer?.id) {
      fetchCampaignDetail()
    }
  }, [params.id, customer])

  const fetchCampaignDetail = async () => {
    try {
      // Fetch customer data to get available campaigns
      const response = await fetch(`/api/customers/${customer?.id}`, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_BEARER_TOKEN}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const foundCampaign = data.availableCampaigns?.find((c: Campaign) => c.id === params.id)
        
        if (foundCampaign) {
          setCampaign(foundCampaign)
        } else {
          toast.error('Kampanya bulunamadı')
          router.back()
        }
      }
    } catch (error) {
      console.error('Failed to fetch campaign:', error)
      toast.error('Kampanya yüklenemedi')
      router.back()
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeIcon = () => {
    if (!campaign) return <Tag className="w-5 h-5" />
    
    switch (campaign.type) {
      case 'DISCOUNT':
      case 'CATEGORY_DISCOUNT':
        return <Percent className="w-5 h-5" />
      case 'PRODUCT_BASED':
      case 'BUY_X_GET_Y':
        return <Gift className="w-5 h-5" />
      case 'LOYALTY_POINTS':
        return <TrendingUp className="w-5 h-5" />
      default:
        return <Tag className="w-5 h-5" />
    }
  }

  const getDiscountDisplay = () => {
    if (!campaign?.discountType || !campaign?.discountValue) return null
    
    if (campaign.discountType === 'PERCENTAGE') {
      return `%${campaign.discountValue} İndirim`
    } else if (campaign.discountType === 'FIXED_AMOUNT') {
      return `${campaign.discountValue} TL İndirim`
    }
    return null
  }

  const getRemainingUsage = () => {
    if (!campaign) return 0
    const used = campaign.usages?.filter(u => u.customerId === customer?.id).length || 0
    return Math.max(0, (campaign.maxUsagePerCustomer || 1) - used)
  }

  const getQRData = () => {
    if (!campaign || !customer) return ''
    
    return JSON.stringify({
      campaignId: campaign.id,
      customerId: customer.id,
      timestamp: new Date().toISOString()
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary"></div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="px-4 py-12 text-center">
        <AlertCircle className="w-16 h-16 text-theme-text-disabled mx-auto mb-4" />
        <h3 className="font-semibold text-theme-text-primary mb-2">
          Kampanya Bulunamadı
        </h3>
        <p className="text-theme-text-secondary">
          Bu kampanya artık mevcut değil veya erişim yetkiniz bulunmuyor.
        </p>
      </div>
    )
  }

  const remainingUsage = getRemainingUsage()
  const isExpired = new Date(campaign.endDate) < new Date()
  const canUse = campaign.isActive && !isExpired && remainingUsage > 0

  return (
    <div className="px-4 pb-20 space-y-6">
      {/* Campaign Header */}
      <ThemedCard>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-theme-primary/10 rounded-theme flex items-center justify-center text-theme-primary">
              {getTypeIcon()}
            </div>
          </div>
          
          <div className="flex-1">
            <h1 className="text-xl font-bold text-theme-text-primary mb-2">
              {campaign.name}
            </h1>
            <p className="text-theme-text-secondary">
              {campaign.description}
            </p>
            
            {/* Discount Badge */}
            {getDiscountDisplay() && (
              <div className="inline-flex items-center gap-1 mt-3 px-3 py-1 bg-theme-accent/10 text-theme-accent rounded-full text-sm font-medium">
                {getDiscountDisplay()}
              </div>
            )}
          </div>
        </div>
      </ThemedCard>

      {/* Campaign Status */}
      <ThemedCard>
        <div className="flex items-center gap-3 mb-4">
          <Info className="w-5 h-5 text-theme-primary" />
          <h2 className="font-semibold text-theme-text-primary">Kampanya Durumu</h2>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-theme-text-secondary">Durum</span>
            <div className="flex items-center gap-2">
              {canUse ? (
                <>
                  <CheckCircle className="w-4 h-4 text-theme-success" />
                  <span className="text-theme-success font-medium">Kullanılabilir</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-theme-error" />
                  <span className="text-theme-error font-medium">
                    {isExpired ? 'Süresi Dolmuş' : remainingUsage === 0 ? 'Kullanım Hakkı Bitmiş' : 'Kullanılamaz'}
                  </span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-theme-text-secondary">Kalan Hak</span>
            <span className="font-medium text-theme-text-primary">
              {remainingUsage} / {campaign.maxUsagePerCustomer || 1}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-theme-text-secondary">Bitiş Tarihi</span>
            <span className="font-medium text-theme-text-primary">
              {format(new Date(campaign.endDate), 'd MMMM yyyy', { locale: tr })}
            </span>
          </div>
          
          {campaign.minPurchase && (
            <div className="flex items-center justify-between">
              <span className="text-theme-text-secondary">Min. Tutar</span>
              <span className="font-medium text-theme-text-primary">
                {campaign.minPurchase} TL
              </span>
            </div>
          )}
        </div>
      </ThemedCard>

      {/* QR Code Section */}
      {canUse && (
        <QRCodeGenerator
          data={getQRData()}
          title="Kampanya QR Kodu"
          subtitle="Bu kodu kasada göstererek kampanyadan faydalanın"
          size={240}
        />
      )}

      {/* Campaign Details */}
      <ThemedCard>
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-theme-primary" />
          <h2 className="font-semibold text-theme-text-primary">Kampanya Detayları</h2>
        </div>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-theme-text-secondary">Başlangıç:</span>
            <span className="text-theme-text-primary">
              {format(new Date(campaign.startDate), 'd MMMM yyyy, HH:mm', { locale: tr })}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-theme-text-secondary">Bitiş:</span>
            <span className="text-theme-text-primary">
              {format(new Date(campaign.endDate), 'd MMMM yyyy, HH:mm', { locale: tr })}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-theme-text-secondary">Toplam Kullanım:</span>
            <span className="text-theme-text-primary">
              {campaign._count?.usages || 0} 
              {campaign.maxUsage && ` / ${campaign.maxUsage}`}
            </span>
          </div>
          
          {campaign.pointsMultiplier && campaign.pointsMultiplier > 1 && (
            <div className="flex justify-between">
              <span className="text-theme-text-secondary">Puan Çarpanı:</span>
              <span className="text-theme-text-primary font-medium">
                {campaign.pointsMultiplier}x
              </span>
            </div>
          )}
        </div>
      </ThemedCard>

      {/* Usage Instructions */}
      <ThemedCard variant="primary" className="text-white">
        <h3 className="font-semibold mb-3">💡 Nasıl Kullanılır?</h3>
        <div className="space-y-2 text-sm opacity-90">
          <p>1. Alışveriş sepetinizi hazırlayın</p>
          <p>2. Kasada QR kodu gösterin</p>
          <p>3. Kampanya otomatik olarak uygulanacak</p>
          <p>4. İndirimli tutarı ödeyin</p>
        </div>
      </ThemedCard>
    </div>
  )
}

export default function CampaignDetailPage() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <MobileContainer title="Kampanya Detayı" showBack showNotifications>
          <CampaignDetailContent />
        </MobileContainer>
      </ThemeProvider>
    </AuthProvider>
  )
}