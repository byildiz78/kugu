'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MobileContainer } from '@/components/mobile/layout/MobileContainer'
import { ThemedCard } from '@/components/mobile/ui/ThemedCard'
import { ThemedButton } from '@/components/mobile/ui/ThemedButton'
import { AuthProvider, useAuth } from '@/lib/mobile/auth-context'
import { ThemeProvider } from '@/lib/mobile/theme-context'
import { 
  Gift, 
  Star, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Info,
  Zap,
  Tag,
  ShoppingBag
} from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'

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
  termsAndConditions?: string
  usageInstructions?: string
}

function RewardDetailContent() {
  const params = useParams()
  const router = useRouter()
  const { customer, refreshCustomer } = useAuth()
  const [reward, setReward] = useState<Reward | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRedeeming, setIsRedeeming] = useState(false)

  useEffect(() => {
    if (params.id && customer?.id) {
      fetchRewardDetail()
    }
  }, [params.id, customer])

  const fetchRewardDetail = async () => {
    try {
      // For demo purposes, create a reward based on the ID
      // In production, this would fetch from API
      const demoRewards: Record<string, Reward> = {
        'demo-1': {
          id: 'demo-1',
          name: '10₺ İndirim Kuponu',
          description: 'Tüm ürünlerde geçerli 10 TL indirim kuponu. Minimum 50 TL alışverişte kullanılabilir.',
          type: 'DISCOUNT',
          category: 'İndirim',
          pointsCost: 200,
          value: 10,
          isAvailable: true,
          termsAndConditions: 'Bu kupon sadece bir kez kullanılabilir. Diğer kampanyalarla birleştirilemez. Minimum 50 TL alışverişte geçerlidir.',
          usageInstructions: 'Kasada bu kuponu göstererek indirimden faydalanabilirsiniz.'
        },
        'demo-2': {
          id: 'demo-2',
          name: 'Bedava Kahve',
          description: 'Seçili kahve çeşitlerinden birini bedava alın. Americano, Latte veya Cappuccino seçebilirsiniz.',
          type: 'FREE_PRODUCT',
          category: 'İçecek',
          pointsCost: 150,
          value: 15,
          isAvailable: true,
          termsAndConditions: 'Sadece belirtilen kahve çeşitleri için geçerlidir. Ek malzeme ücretsizdir.',
          usageInstructions: 'Kasada bu kuponu göstererek bedava kahvenizi alabilirsiniz.'
        },
        'demo-3': {
          id: 'demo-3',
          name: '%15 İndirim',
          description: 'Tüm menüde %15 indirim fırsatı. Tüm yiyecek ve içeceklerde geçerlidir.',
          type: 'DISCOUNT',
          category: 'İndirim',
          pointsCost: 300,
          value: 15,
          isAvailable: customer?.points ? customer.points >= 300 : false,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          termsAndConditions: 'Tüm menüde geçerlidir. Diğer kampanyalarla birleştirilemez.',
          usageInstructions: 'Kasada bu kuponu göstererek %15 indirimden yararlanabilirsiniz.'
        },
        'demo-4': {
          id: 'demo-4',
          name: 'Bedava Tatlı',
          description: 'Günün tatlısını bedava alın. Her gün farklı tatlı seçenekleri mevcuttur.',
          type: 'FREE_PRODUCT',
          category: 'Tatlı',
          pointsCost: 250,
          value: 20,
          isAvailable: customer?.points ? customer.points >= 250 : false,
          termsAndConditions: 'Sadece günün tatlısı için geçerlidir. Mevcut tatlı seçenekleri için personele danışın.',
          usageInstructions: 'Kasada bu kuponu göstererek bedava tatlınızı alabilirsiniz.'
        },
        'demo-5': {
          id: 'demo-5',
          name: '50₺ Hediye Çeki',
          description: 'Bir sonraki ziyaretinizde kullanabileceğiniz 50 TL değerinde hediye çeki.',
          type: 'VOUCHER',
          category: 'Hediye',
          pointsCost: 500,
          value: 50,
          isAvailable: customer?.points ? customer.points >= 500 : false,
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          termsAndConditions: 'Hediye çeki 60 gün içinde kullanılmalıdır. Bozuk para verilmez.',
          usageInstructions: 'Hediye çeki kodunuz bir sonraki ziyaretinizde kasada kullanılabilir.'
        }
      }

      const foundReward = demoRewards[params.id as string]
      if (foundReward) {
        setReward(foundReward)
      } else {
        toast.error('Ödül bulunamadı')
        router.back()
      }
    } catch (error) {
      console.error('Failed to fetch reward:', error)
      toast.error('Ödül yüklenemedi')
      router.back()
    } finally {
      setIsLoading(false)
    }
  }

  const handleRedeem = async () => {
    if (!reward || !customer) return

    const customerPoints = customer.points || 0
    if (customerPoints < reward.pointsCost) {
      toast.error('Yeterli puanınız bulunmuyor')
      return
    }

    setIsRedeeming(true)
    try {
      // Simulate API call to redeem reward
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Update customer points locally (in production, this would come from API)
      await refreshCustomer()
      
      toast.success('🎉 Ödül başarıyla alındı!')
      
      // Navigate to success/confirmation page or show modal
      setTimeout(() => {
        router.push('/mobile/profile') // or rewards redemption history
      }, 2000)
    } catch (error) {
      console.error('Failed to redeem reward:', error)
      toast.error('Ödül alınırken hata oluştu')
    } finally {
      setIsRedeeming(false)
    }
  }

  const getTypeIcon = () => {
    if (!reward) return <Gift className="w-5 h-5" />
    
    switch (reward.type) {
      case 'DISCOUNT':
        return <Tag className="w-5 h-5" />
      case 'FREE_PRODUCT':
        return <Gift className="w-5 h-5" />
      case 'VOUCHER':
        return <ShoppingBag className="w-5 h-5" />
      default:
        return <Gift className="w-5 h-5" />
    }
  }

  const getTypeColor = () => {
    if (!reward) return 'text-blue-500'
    
    switch (reward.type) {
      case 'DISCOUNT':
        return 'text-orange-500'
      case 'FREE_PRODUCT':
        return 'text-green-500'
      case 'VOUCHER':
        return 'text-purple-500'
      default:
        return 'text-blue-500'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary"></div>
      </div>
    )
  }

  if (!reward) {
    return (
      <div className="px-4 py-12 text-center">
        <AlertCircle className="w-16 h-16 text-theme-text-disabled mx-auto mb-4" />
        <h3 className="font-semibold text-theme-text-primary mb-2">
          Ödül Bulunamadı
        </h3>
        <p className="text-theme-text-secondary">
          Bu ödül artık mevcut değil veya erişim yetkiniz bulunmuyor.
        </p>
      </div>
    )
  }

  const customerPoints = customer?.points || 0
  const canAfford = customerPoints >= reward.pointsCost
  const isExpired = reward.expiresAt ? new Date(reward.expiresAt) < new Date() : false
  const canRedeem = reward.isAvailable && canAfford && !isExpired

  return (
    <div className="px-4 pb-20 space-y-6">
      {/* Reward Header */}
      <ThemedCard>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {reward.imageUrl ? (
              <img 
                src={reward.imageUrl} 
                alt={reward.name}
                className="w-20 h-20 rounded-theme object-cover"
              />
            ) : (
              <div className={`w-20 h-20 bg-theme-primary/10 rounded-theme flex items-center justify-center ${getTypeColor()}`}>
                {getTypeIcon()}
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <h1 className="text-xl font-bold text-theme-text-primary mb-2">
              {reward.name}
            </h1>
            <p className="text-theme-text-secondary mb-3">
              {reward.description}
            </p>
            
            {/* Category Badge */}
            {reward.category && (
              <div className="inline-flex items-center gap-1 px-3 py-1 bg-theme-primary/10 text-theme-primary rounded-full text-sm font-medium">
                {reward.category}
              </div>
            )}
          </div>
        </div>
      </ThemedCard>

      {/* Points & Value */}
      <ThemedCard>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            <span className="font-semibold text-theme-text-primary">
              {reward.pointsCost.toLocaleString('tr-TR')} Puan
            </span>
          </div>
          
          {reward.value && (
            <span className="text-theme-text-secondary">
              ({reward.value} TL değerinde)
            </span>
          )}
        </div>

        {/* Affordability Status */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
          <span className="text-theme-text-secondary">Mevcut Puanınız</span>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            <span className={`font-semibold ${canAfford ? 'text-theme-success' : 'text-theme-error'}`}>
              {customerPoints.toLocaleString('tr-TR')}
            </span>
          </div>
        </div>

        {!canAfford && (
          <div className="mt-3 p-3 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {(reward.pointsCost - customerPoints).toLocaleString('tr-TR')} puan daha gerekli
              </span>
            </div>
          </div>
        )}
      </ThemedCard>

      {/* Status & Expiry */}
      <ThemedCard>
        <div className="flex items-center gap-3 mb-4">
          <Info className="w-5 h-5 text-theme-primary" />
          <h2 className="font-semibold text-theme-text-primary">Ödül Durumu</h2>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-theme-text-secondary">Durum</span>
            <div className="flex items-center gap-2">
              {canRedeem ? (
                <>
                  <CheckCircle className="w-4 h-4 text-theme-success" />
                  <span className="text-theme-success font-medium">Alınabilir</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-theme-error" />
                  <span className="text-theme-error font-medium">
                    {isExpired ? 'Süresi Dolmuş' : !canAfford ? 'Yetersiz Puan' : 'Kullanılamaz'}
                  </span>
                </>
              )}
            </div>
          </div>
          
          {reward.expiresAt && (
            <div className="flex items-center justify-between">
              <span className="text-theme-text-secondary">Geçerlilik</span>
              <div className="flex items-center gap-1 text-theme-text-primary">
                <Clock className="w-4 h-4" />
                <span className="font-medium">
                  {format(new Date(reward.expiresAt), 'd MMMM yyyy', { locale: tr })}
                </span>
              </div>
            </div>
          )}
        </div>
      </ThemedCard>

      {/* Usage Instructions */}
      {reward.usageInstructions && (
        <ThemedCard>
          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-5 h-5 text-theme-primary" />
            <h2 className="font-semibold text-theme-text-primary">Nasıl Kullanılır?</h2>
          </div>
          <p className="text-sm text-theme-text-secondary">
            {reward.usageInstructions}
          </p>
        </ThemedCard>
      )}

      {/* Terms and Conditions */}
      {reward.termsAndConditions && (
        <ThemedCard>
          <div className="flex items-center gap-3 mb-3">
            <Info className="w-5 h-5 text-theme-primary" />
            <h2 className="font-semibold text-theme-text-primary">Şartlar ve Koşullar</h2>
          </div>
          <p className="text-sm text-theme-text-secondary">
            {reward.termsAndConditions}
          </p>
        </ThemedCard>
      )}

      {/* Redeem Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-theme-background border-t border-gray-200">
        <ThemedButton
          variant={canRedeem ? 'primary' : 'outline'}
          size="lg"
          onClick={handleRedeem}
          disabled={!canRedeem || isRedeeming}
          className="w-full"
        >
          {isRedeeming ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Alınıyor...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              {canRedeem ? 'Ödülü Al' : !canAfford ? 'Yetersiz Puan' : 'Alınamaz'}
            </div>
          )}
        </ThemedButton>
        
        {canRedeem && (
          <p className="text-xs text-center text-theme-text-secondary mt-2">
            Bu işlem {reward.pointsCost.toLocaleString('tr-TR')} puanınızı kullanacak
          </p>
        )}
      </div>
    </div>
  )
}

export default function RewardDetailPage() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <MobileContainer title="Ödül Detayı" showBack showNotifications>
          <RewardDetailContent />
        </MobileContainer>
      </ThemeProvider>
    </AuthProvider>
  )
}