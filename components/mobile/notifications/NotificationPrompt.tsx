'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Bell, Gift } from 'lucide-react'
import { webPushService } from '@/lib/mobile/web-push'
import { useTheme } from '@/lib/mobile/theme-context'
import { NotificationPermissionModal } from './NotificationPermissionModal'

interface NotificationPromptProps {
  customerId: string
}

export function NotificationPrompt({ customerId }: NotificationPromptProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    checkShouldShowPrompt()
  }, [])

  const checkShouldShowPrompt = async () => {
    // Don't show if already subscribed
    if (webPushService.isSubscriptionRegistered()) {
      return
    }

    // Don't show if permission denied
    if (webPushService.getPermissionStatus() === 'denied') {
      return
    }

    // Don't show if user dismissed recently
    const dismissedAt = localStorage.getItem('notification-prompt-dismissed')
    if (dismissedAt) {
      const dismissedTime = new Date(dismissedAt).getTime()
      const now = new Date().getTime()
      const dayInMs = 24 * 60 * 60 * 1000
      
      // Show again after 3 days
      if (now - dismissedTime < 3 * dayInMs) {
        return
      }
    }

    // Don't show immediately, wait a bit for user to settle
    setTimeout(() => {
      setIsVisible(true)
    }, 3000)
  }

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('notification-prompt-dismissed', new Date().toISOString())
  }

  const handleEnable = () => {
    setShowModal(true)
  }

  const handleSuccess = () => {
    setIsVisible(false)
    localStorage.removeItem('notification-prompt-dismissed')
  }

  if (!isVisible) {
    return null
  }

  return (
    <>
      <Card className="mobile-app mb-6 border-0 shadow-lg"
            style={{ 
              background: `linear-gradient(135deg, ${theme.primary}15 0%, ${theme.secondary}15 100%)`,
              borderLeft: `4px solid ${theme.primary}`
            }}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                   style={{ backgroundColor: theme.primary + '20' }}>
                <Bell className="w-5 h-5" style={{ color: theme.primary }} />
              </div>
              
              <div className="flex-1">
                <h3 className="font-semiBold text-theme-text-primary mb-1">
                  Özel Fırsatları Kaçırma! 🎁
                </h3>
                <p className="text-sm text-theme-text-secondary mb-3">
                  Bildirimlerinizi aktif ederek size özel kampanya ve ödüllerden anında haberdar olun.
                </p>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleEnable}
                    style={{ backgroundColor: theme.primary }}
                    className="text-white"
                  >
                    <Bell className="w-4 h-4 mr-1" />
                    Aktif Et
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDismiss}
                  >
                    Şimdi Değil
                  </Button>
                </div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="w-8 h-8 p-0 ml-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <NotificationPermissionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        customerId={customerId}
        onSuccess={handleSuccess}
      />
    </>
  )
}