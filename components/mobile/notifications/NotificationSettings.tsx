'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Bell, BellOff, Settings, TestTube, CheckCircle, XCircle } from 'lucide-react'
import { webPushService } from '@/lib/mobile/web-push'
import { toast } from 'sonner'
import { useTheme } from '@/lib/mobile/theme-context'
import { NotificationPermissionModal } from './NotificationPermissionModal'

interface NotificationSettingsProps {
  customerId: string
}

export function NotificationSettings({ customerId }: NotificationSettingsProps) {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    checkNotificationStatus()
  }, [])

  const checkNotificationStatus = async () => {
    setIsSupported(webPushService.isNotificationSupported())
    setPermission(webPushService.getPermissionStatus())
    setIsSubscribed(webPushService.isSubscriptionRegistered())
  }

  const handleEnableNotifications = async () => {
    if (permission === 'default') {
      setShowPermissionModal(true)
      return
    }

    if (permission === 'denied') {
      toast.error('Bildirim izni reddedilmiş. Tarayıcı ayarlarından izin vermeniz gerekiyor.')
      return
    }

    setLoading(true)
    try {
      const success = await webPushService.initialize(customerId)
      if (success) {
        setIsSubscribed(true)
        toast.success('Bildirimler aktif edildi!')
      } else {
        toast.error('Bildirimler aktif edilemedi')
      }
    } catch (error) {
      toast.error('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleDisableNotifications = async () => {
    if (!isSubscribed) return

    setLoading(true)
    try {
      const success = await webPushService.unregisterSubscription(customerId)
      if (success) {
        setIsSubscribed(false)
        toast.success('Bildirimler devre dışı bırakıldı')
      } else {
        toast.error('Bildirimler kapatılamadı')
      }
    } catch (error) {
      toast.error('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleTestNotification = async () => {
    if (!isSubscribed) {
      toast.error('Önce bildirimleri aktif etmelisiniz')
      return
    }

    setLoading(true)
    try {
      await webPushService.sendTestNotification(customerId, 'GENERAL')
    } catch (error) {
      // Error handling is done in the service
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = () => {
    if (!isSupported) return 'bg-gray-100 text-gray-800'
    if (permission === 'denied') return 'bg-red-100 text-red-800'
    if (isSubscribed) return 'bg-green-100 text-green-800'
    return 'bg-yellow-100 text-yellow-800'
  }

  const getStatusText = () => {
    if (!isSupported) return 'Desteklenmiyor'
    if (permission === 'denied') return 'Reddedildi'
    if (isSubscribed) return 'Aktif'
    return 'Pasif'
  }

  const getStatusIcon = () => {
    if (!isSupported || permission === 'denied') return XCircle
    if (isSubscribed) return CheckCircle
    return BellOff
  }

  const StatusIcon = getStatusIcon()

  if (!isSupported) {
    return (
      <Card className="mobile-app">
        <CardContent className="p-6 text-center">
          <BellOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-medium text-gray-900 mb-2">
            Bildirimler Desteklenmiyor
          </h3>
          <p className="text-sm text-gray-600">
            Tarayıcınız push bildirimleri desteklemiyor.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="mobile-app">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                   style={{ backgroundColor: theme.primary + '20' }}>
                <Bell className="w-5 h-5" style={{ color: theme.primary }} />
              </div>
              <div>
                <CardTitle className="text-lg">Push Bildirimler</CardTitle>
                <CardDescription>
                  Kampanya ve güncellemelerden haberdar olun
                </CardDescription>
              </div>
            </div>
            
            <Badge className={getStatusColor()}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {getStatusText()}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Main Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium">Bildirimler</h4>
              <p className="text-sm text-gray-600">
                {isSubscribed ? 'Bildirimler aktif' : 'Bildirimler pasif'}
              </p>
            </div>
            <Switch
              checked={isSubscribed}
              onCheckedChange={isSubscribed ? handleDisableNotifications : handleEnableNotifications}
              disabled={loading || permission === 'denied'}
            />
          </div>

          {/* Permission Denied Message */}
          {permission === 'denied' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900">Bildirim İzni Reddedildi</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Bildirimleri aktif etmek için tarayıcı ayarlarından bu siteye bildirim izni vermeniz gerekiyor.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 text-red-700 border-red-300"
                    onClick={() => {
                      toast.info('Tarayıcı ayarlarından bu site için bildirimleri aktif edin')
                    }}
                  >
                    Nasıl Aktif Ederim?
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Feature List */}
          {(permission === 'granted' || isSubscribed) && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-700">Bildirim Türleri</h4>
              
              <div className="space-y-2">
                {[
                  { label: 'Kampanya Bildirimleri', desc: 'Özel indirim ve kampanyalar' },
                  { label: 'Ödül Bildirimleri', desc: 'Yeni ödüller ve kazanımlar' },
                  { label: 'Puan Bildirimleri', desc: 'Puan kazanımı ve güncellemeleri' },
                  { label: 'Genel Bildirimler', desc: 'Önemli duyurular' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-gray-600">{item.desc}</p>
                    </div>
                    <Switch checked={isSubscribed} disabled />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Button */}
          {isSubscribed && (
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleTestNotification}
                disabled={loading}
                className="w-full"
              >
                <TestTube className="w-4 h-4 mr-2" />
                {loading ? 'Test Gönderiliyor...' : 'Test Bildirimi Gönder'}
              </Button>
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              💡 Bildirimleri istediğiniz zaman açıp kapatabilirsiniz. Verileriniz güvenli tutulur.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Permission Modal */}
      <NotificationPermissionModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        customerId={customerId}
        onSuccess={() => {
          setIsSubscribed(true)
          setPermission('granted')
          checkNotificationStatus()
        }}
      />
    </>
  )
}