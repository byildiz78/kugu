'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MobileContainer } from '@/components/mobile/layout/MobileContainer'
import { ThemedCard } from '@/components/mobile/ui/ThemedCard'
import { ThemedButton } from '@/components/mobile/ui/ThemedButton'
import { AuthProvider, useAuth } from '@/lib/mobile/auth-context'
import { ThemeProvider, useTheme } from '@/lib/mobile/theme-context'
import { useNotifications } from '@/hooks/useNotifications'
import { 
  User, 
  Phone, 
  Calendar, 
  Star, 
  Award, 
  Bell, 
  Settings, 
  LogOut, 
  Edit3,
  Gift,
  TrendingUp,
  Clock,
  ChevronRight,
  Shield,
  HelpCircle,
  MessageSquare,
  History
} from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'

function ProfileContent() {
  const { customer, logout } = useAuth()
  const { theme } = useTheme()
  const { count: notificationCount } = useNotifications()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logout()
      toast.success('Çıkış yapıldı')
      router.push('/mobile/auth/phone')
    } catch (error) {
      console.error('Logout failed:', error)
      toast.error('Çıkış yapılırken hata oluştu')
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleEditProfile = () => {
    router.push('/mobile/profile/edit')
  }

  const handleNotificationSettings = () => {
    router.push('/mobile/profile/notifications')
  }

  const getTierInfo = () => {
    const points = customer?.points || 0
    
    if (points < 100) {
      return {
        current: 'Bronz',
        next: 'Gümüş',
        progress: points,
        target: 100,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        benefits: ['%5 puan bonusu', 'Özel kampanyalar']
      }
    } else if (points < 500) {
      return {
        current: 'Gümüş',
        next: 'Altın',
        progress: points - 100,
        target: 400,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        benefits: ['%10 puan bonusu', 'Ücretsiz kargo', 'Öncelikli destek']
      }
    } else if (points < 1000) {
      return {
        current: 'Altın',
        next: 'Platin',
        progress: points - 500,
        target: 500,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        benefits: ['%15 puan bonusu', 'VIP etkinlikler', 'Özel indirimler']
      }
    } else {
      return {
        current: 'Platin',
        next: null,
        progress: 0,
        target: 0,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        benefits: ['%20 puan bonusu', 'Kişisel müşteri temsilcisi', 'Premium avantajlar']
      }
    }
  }

  const tierInfo = getTierInfo()

  return (
    <div className="px-4 pb-20 space-y-6">
      {/* Profile Header */}
      <ThemedCard>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: `${theme.primary}15` }}>
            <User className="w-8 h-8" style={{ color: theme.primary }} />
          </div>
          
          <div className="flex-1">
            <h1 className="text-xl font-bold text-theme-text-primary">
              {customer?.name}
            </h1>
            <div className="flex items-center gap-1 text-theme-text-secondary mt-1">
              <Phone className="w-4 h-4" />
              <span className="text-sm">{customer?.phone}</span>
            </div>
            {customer?.birthDate && (
              <div className="flex items-center gap-1 text-theme-text-secondary mt-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  {format(new Date(customer.birthDate), 'd MMMM yyyy', { locale: tr })}
                </span>
              </div>
            )}
          </div>
          
          <ThemedButton
            variant="outline"
            size="sm"
            onClick={handleEditProfile}
          >
            <Edit3 className="w-4 h-4" />
          </ThemedButton>
        </div>
      </ThemedCard>

      {/* Points & Tier */}
      <ThemedCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-theme-text-primary">Puan & Seviye</h2>
          <div className={`px-3 py-1 ${tierInfo.bgColor} ${tierInfo.color} rounded-full text-sm font-medium`}>
            {tierInfo.current}
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Current Points */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              <span className="text-theme-text-secondary">Toplam Puanınız</span>
            </div>
            <span className="text-2xl font-bold text-theme-text-primary">
              {customer?.points?.toLocaleString('tr-TR') || '0'}
            </span>
          </div>

          {/* Tier Progress */}
          {tierInfo.next && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-theme-text-secondary">
                  {tierInfo.next} seviyesine
                </span>
                <span className="text-theme-text-primary font-medium">
                  {tierInfo.target - tierInfo.progress} puan kaldı
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    backgroundColor: theme.primary,
                    width: `${Math.min(100, (tierInfo.progress / tierInfo.target) * 100)}%`
                  }}
                ></div>
              </div>
            </div>
          )}

          {/* Tier Benefits */}
          <div className="pt-3 border-t border-gray-100">
            <h3 className="text-sm font-medium text-theme-text-primary mb-2">
              {tierInfo.current} Avantajları
            </h3>
            <div className="space-y-1">
              {tierInfo.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-theme-text-secondary">
                  <Award className="w-3 h-3" style={{ color: theme.primary }} />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ThemedCard>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <ThemedCard className="text-center">
          <Gift className="w-8 h-8 mx-auto mb-2" style={{ color: theme.primary }} />
          <div className="text-2xl font-bold text-theme-text-primary mb-1">
            {customer?.rewards?.filter(reward => reward.isRedeemed).length || 0}
          </div>
          <div className="text-sm text-theme-text-secondary">
            Alınan Ödül
          </div>
        </ThemedCard>
        
        <ThemedCard className="text-center">
          <TrendingUp className="w-8 h-8 mx-auto mb-2" style={{ color: theme.primary }} />
          <div className="text-2xl font-bold text-theme-text-primary mb-1">
            {customer?.campaignUsages?.length || 0}
          </div>
          <div className="text-sm text-theme-text-secondary">
            Kullanılan Kampanya
          </div>
        </ThemedCard>
      </div>

      {/* Menu Items */}
      <div className="space-y-3">
        {/* Account Settings */}
        <ThemedCard interactive onClick={handleEditProfile}>
          <div className="flex items-center gap-4 p-1">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${theme.primary}15` }}>
              <Settings className="w-5 h-5" style={{ color: theme.primary }} />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-theme-text-primary">Hesap Ayarları</h3>
              <p className="text-sm text-theme-text-secondary">Kişisel bilgilerinizi düzenleyin</p>
            </div>
            <ChevronRight className="w-5 h-5 text-theme-text-secondary" />
          </div>
        </ThemedCard>

        {/* Notification Settings */}
        <ThemedCard interactive onClick={handleNotificationSettings}>
          <div className="flex items-center gap-4 p-1">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${theme.secondary}15` }}>
              <Settings className="w-5 h-5" style={{ color: theme.secondary }} />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-theme-text-primary">Bildirim Ayarları</h3>
              <p className="text-sm text-theme-text-secondary">Bildirim tercihlerinizi yönetin</p>
            </div>
            <ChevronRight className="w-5 h-5 text-theme-text-secondary" />
          </div>
        </ThemedCard>

        {/* Notification History */}
        <ThemedCard interactive onClick={() => router.push('/mobile/notifications')}>
          <div className="flex items-center gap-4 p-1">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center relative" style={{ backgroundColor: `${theme.accent}15` }}>
              <Bell className="w-5 h-5" style={{ color: theme.accent }} />
              {notificationCount.unread > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-5 h-5 flex items-center justify-center px-1">
                  {notificationCount.unread > 99 ? '99+' : notificationCount.unread}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-theme-text-primary">Bildirim Geçmişi</h3>
              <p className="text-sm text-theme-text-secondary">
                {notificationCount.unread > 0 
                  ? `${notificationCount.unread} okunmamış bildirim` 
                  : 'Gönderilen tüm bildirimleri görün'}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-theme-text-secondary" />
          </div>
        </ThemedCard>

        {/* Transaction History */}
        <ThemedCard interactive onClick={() => router.push('/mobile/history')}>
          <div className="flex items-center gap-4 p-1">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${theme.success}15` }}>
              <Clock className="w-5 h-5" style={{ color: theme.success }} />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-theme-text-primary">İşlem Geçmişi</h3>
              <p className="text-sm text-theme-text-secondary">Geçmiş işlemlerinizi görüntüleyin</p>
            </div>
            <ChevronRight className="w-5 h-5 text-theme-text-secondary" />
          </div>
        </ThemedCard>

        {/* Privacy */}
        <ThemedCard interactive>
          <div className="flex items-center gap-4 p-1">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${theme.warning}15` }}>
              <Shield className="w-5 h-5" style={{ color: theme.warning }} />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-theme-text-primary">Gizlilik</h3>
              <p className="text-sm text-theme-text-secondary">Gizlilik ayarlarınızı yönetin</p>
            </div>
            <ChevronRight className="w-5 h-5 text-theme-text-secondary" />
          </div>
        </ThemedCard>

        {/* Help & Support */}
        <ThemedCard interactive>
          <div className="flex items-center gap-4 p-1">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${theme.info}15` }}>
              <HelpCircle className="w-5 h-5" style={{ color: theme.info }} />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-theme-text-primary">Yardım & Destek</h3>
              <p className="text-sm text-theme-text-secondary">SSS ve destek merkezi</p>
            </div>
            <ChevronRight className="w-5 h-5 text-theme-text-secondary" />
          </div>
        </ThemedCard>

        {/* Feedback */}
        <ThemedCard interactive>
          <div className="flex items-center gap-4 p-1">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${theme.accent}15` }}>
              <MessageSquare className="w-5 h-5" style={{ color: theme.accent }} />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-theme-text-primary">Geri Bildirim</h3>
              <p className="text-sm text-theme-text-secondary">Görüş ve önerilerinizi paylaşın</p>
            </div>
            <ChevronRight className="w-5 h-5 text-theme-text-secondary" />
          </div>
        </ThemedCard>
      </div>

      {/* Member Since */}
      <ThemedCard className="text-center">
        <Calendar className="w-8 h-8 text-theme-text-secondary mx-auto mb-2" />
        <p className="text-sm text-theme-text-secondary">
          Üye olduğunuz tarih
        </p>
        <p className="font-medium text-theme-text-primary">
          {customer?.createdAt 
            ? format(new Date(customer.createdAt), 'd MMMM yyyy', { locale: tr })
            : 'Bilinmiyor'
          }
        </p>
      </ThemedCard>

      {/* Logout Button */}
      <ThemedCard>
        <ThemedButton
          variant="outline"
          size="lg"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full"
          style={{
            color: theme.error,
            borderColor: `${theme.error}20`
          }}
        >
          {isLoggingOut ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderBottomColor: theme.error }}></div>
              Çıkış yapılıyor...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <LogOut className="w-5 h-5" />
              Çıkış Yap
            </div>
          )}
        </ThemedButton>
      </ThemedCard>

      {/* App Version */}
      <div className="text-center text-xs text-theme-text-enabled">
        robotPOS Air CRM Mobile v1.0.5
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <MobileContainer title="Profil" showBack showNotifications>
          <ProfileContent />
        </MobileContainer>
      </ThemeProvider>
    </AuthProvider>
  )
}