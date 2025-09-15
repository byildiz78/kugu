'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Bell, Gift, Megaphone, Star, X } from 'lucide-react'
import { webPushService } from '@/lib/mobile/web-push'
import { toast } from 'sonner'
import { useTheme } from '@/lib/mobile/theme-context'
import { createPortal } from 'react-dom'

interface NotificationPermissionModalProps {
  isOpen: boolean
  onClose: () => void
  customerId: string
  onSuccess?: () => void
}

export function NotificationPermissionModal({ 
  isOpen, 
  onClose, 
  customerId, 
  onSuccess 
}: NotificationPermissionModalProps) {
  const [loading, setLoading] = useState(false)
  const { theme } = useTheme()

  const handleEnableNotifications = async () => {
    setLoading(true)
    try {
      console.log('🔔 Enabling notifications for customer:', customerId)
      const success = await webPushService.initialize(customerId)
      
      if (success) {
        toast.success('Bildirimler aktif edildi! 🎉')
        onSuccess?.()
        onClose()
      } else {
        toast.error('Bildirimler aktif edilemedi. Lütfen tarayıcı ayarlarınızı kontrol edin.')
      }
    } catch (error: any) {
      console.error('Error enabling notifications:', error)
      
      let errorMessage = 'Bir hata oluştu. Lütfen tekrar deneyin.'
      
      if (error.message?.includes('VAPID')) {
        errorMessage = 'Bildirim servisi yapılandırılmamış. Lütfen sistem yöneticisine başvurun.'
      } else if (error.message?.includes('denied')) {
        errorMessage = 'Bildirim izni reddedildi. Tarayıcı ayarlarından izin verebilirsiniz.'
      } else if (error.message?.includes('aborted')) {
        errorMessage = 'İşlem iptal edildi. Lütfen tekrar deneyin.'
      } else if (error.message?.includes('Service Worker')) {
        errorMessage = 'Servis çalışanı yüklenemiyor. Sayfayı yenileyin ve tekrar deneyin.'
      }
      
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const benefits = [
    {
      icon: Gift,
      title: 'Özel Kampanyalar',
      description: 'Size özel indirim ve kampanyalardan ilk siz haberdar olun'
    },
    {
      icon: Star,
      title: 'Puan Bildirimleri',
      description: 'Puan kazandığınızda ve ödül kazandığınızda anında bilgi alın'
    },
    {
      icon: Megaphone,
      title: 'Yeni Ürünler',
      description: 'Yeni menü öğeleri ve özel tekliflerden haberdar olun'
    }
  ]

  if (!isOpen || typeof window === 'undefined') return null

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div 
        className="mobile-app bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-6">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute -top-2 -right-2 w-8 h-8 rounded-full"
          >
            <X className="w-4 h-4" />
          </Button>

          <div className="text-center pb-4">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center"
                 style={{ backgroundColor: theme.primary + '20' }}>
              <Bell className="w-8 h-8" style={{ color: theme.primary }} />
            </div>
            
            <h2 className="text-xl font-bold">
              Bildirimleri Aktif Et
            </h2>
            
            <p className="text-center text-gray-600 mt-2">
              Özel kampanyalar, puan güncellemeleri ve fırsatları kaçırmayın!
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-4 py-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                     style={{ backgroundColor: theme.primary + '15' }}>
                  <benefit.icon className="w-5 h-5" style={{ color: theme.primary }} />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{benefit.title}</h4>
                  <p className="text-xs text-gray-600 mt-1">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Privacy Note */}
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <p className="text-xs text-gray-600 text-center">
              🔒 Bildirimleriniz güvenlidir. İstediğiniz zaman ayarlardan kapatabilirsiniz.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleEnableNotifications}
              disabled={loading}
              className="w-full h-12 text-white font-medium"
              style={{ backgroundColor: theme.primary }}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Aktif Ediliyor...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Bildirimleri Aktif Et
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={onClose}
              className="w-full h-10"
              disabled={loading}
            >
              Şimdi Değil
            </Button>
          </div>

          {/* Additional Info */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Bildirim izni vermeniz durumunda tarayıcınız size bildirim gönderme izni isteyecektir.
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}