'use client'

import { useState, useEffect } from 'react'
import { ThemedCard } from './ThemedCard'
import { ThemedButton } from './ThemedButton'
import { webPushService } from '@/lib/mobile/web-push'
import { Bell, X, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/mobile/auth-context'
import { toast } from 'sonner'

interface NotificationPermissionDialogProps {
  onClose?: () => void
  autoShow?: boolean
}

export function NotificationPermissionDialog({ 
  onClose, 
  autoShow = true 
}: NotificationPermissionDialogProps) {
  const { customer } = useAuth()
  const [isVisible, setIsVisible] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!webPushService.isNotificationSupported()) {
      return
    }

    const currentPermission = webPushService.getPermissionStatus()
    setPermission(currentPermission)

    // Show dialog if permission is default and autoShow is enabled
    if (autoShow && currentPermission === 'default' && !webPushService.isSubscriptionRegistered()) {
      // Small delay to ensure smooth UX
      setTimeout(() => setIsVisible(true), 1000)
    }
  }, [autoShow])

  const handleAllowNotifications = async () => {
    if (!customer?.id) {
      toast.error('Müşteri bilgisi bulunamadı')
      return
    }

    setIsLoading(true)
    try {
      // Request permission
      const newPermission = await webPushService.requestPermission()
      setPermission(newPermission)

      if (newPermission === 'granted') {
        // Initialize and register subscription
        const success = await webPushService.initialize(customer.id)
        
        if (success) {
          toast.success('🔔 Bildirimler aktifleştirildi!')
          setIsVisible(false)
          onClose?.()
        } else {
          toast.error('Bildirim kurulumu başarısız oldu')
        }
      } else {
        toast.error('Bildirim izni reddedildi')
      }
    } catch (error) {
      console.error('Error enabling notifications:', error)
      toast.error('Bildirim izni alınamadı')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    onClose?.()
    // Remember user's choice to not show again for a while
    localStorage.setItem('notification-permission-dismissed', Date.now().toString())
  }

  const handleTestNotification = async () => {
    if (!customer?.id) return

    setIsLoading(true)
    try {
      await webPushService.sendTestNotification(customer.id, 'GENERAL')
    } catch (error) {
      console.error('Error sending test notification:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render if not supported or not visible
  if (!webPushService.isNotificationSupported() || !isVisible) {
    return null
  }

  // Don't show if already dismissed recently (within 24 hours)
  const dismissedTime = localStorage.getItem('notification-permission-dismissed')
  if (dismissedTime && Date.now() - parseInt(dismissedTime) < 24 * 60 * 60 * 1000) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <ThemedCard className="max-w-sm w-full relative">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-theme-text-secondary hover:text-theme-text-primary"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-theme-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-theme-primary" />
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-theme-text-primary mb-2">
            Bildirimleri Açalım mı?
          </h3>

          {/* Description */}
          <p className="text-theme-text-secondary text-sm mb-6">
            Yeni kampanyalar, ödüller ve puan güncellemeleri hakkında anlık bildirim alın. 
            İstediğiniz zaman kapatabilirsiniz.
          </p>

          {/* Benefits */}
          <div className="space-y-2 mb-6 text-left">
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle className="w-4 h-4 text-theme-success flex-shrink-0" />
              <span className="text-theme-text-secondary">Özel kampanya duyuruları</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle className="w-4 h-4 text-theme-success flex-shrink-0" />
              <span className="text-theme-text-secondary">Puan kazancı bildirimleri</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle className="w-4 h-4 text-theme-success flex-shrink-0" />
              <span className="text-theme-text-secondary">Yeni ödül duyuruları</span>
            </div>
          </div>

          {/* Permission Status */}
          {permission !== 'default' && (
            <div className={`flex items-center justify-center gap-2 mb-4 p-2 rounded-lg ${
              permission === 'granted' 
                ? 'bg-green-50 text-green-700' 
                : 'bg-red-50 text-red-700'
            }`}>
              {permission === 'granted' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {permission === 'granted' 
                  ? 'Bildirimler aktif' 
                  : 'Bildirimler kapalı'
                }
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {permission === 'default' && (
              <ThemedButton
                variant="primary"
                size="lg"
                onClick={handleAllowNotifications}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Ayarlanıyor...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Bildirimleri Aç
                  </div>
                )}
              </ThemedButton>
            )}

            {permission === 'granted' && (
              <ThemedButton
                variant="outline"
                size="lg"
                onClick={handleTestNotification}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-theme-primary"></div>
                    Gönderiliyor...
                  </div>
                ) : (
                  'Test Bildirimi Gönder'
                )}
              </ThemedButton>
            )}

            <ThemedButton
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="w-full"
            >
              Şimdi Değil
            </ThemedButton>
          </div>

          {/* Privacy Note */}
          <p className="text-xs text-theme-text-disabled mt-4">
            Bildirim tercihlerinizi istediğiniz zaman profil ayarlarından değiştirebilirsiniz.
          </p>
        </div>
      </ThemedCard>
    </div>
  )
}