'use client'

import { useEffect, useState } from 'react'
import { MobileContainer } from '@/components/mobile/layout/MobileContainer'
import { AuthProvider, useAuth } from '@/lib/mobile/auth-context'
import { ThemeProvider, useTheme } from '@/lib/mobile/theme-context'
import { Bell, Clock, Info, AlertCircle, CheckCircle2, Gift } from 'lucide-react'
import { LoadingSpinner } from '@/components/mobile/ui/LoadingSpinner'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useNotifications } from '@/hooks/useNotifications'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  status: string
  createdAt: string
  data?: any
}

interface NotificationHistoryResponse {
  notifications: Notification[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

function NotificationsContent() {
  const { customer } = useAuth()
  const { theme } = useTheme()
  const { refresh: refreshNotificationCount } = useNotifications()
  const [data, setData] = useState<NotificationHistoryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (customer?.id) {
      fetchNotifications()
    }
  }, [customer])

  const fetchNotifications = async (page = 1) => {
    try {
      if (page === 1) {
        setIsLoading(true)
        setError(null)
      } else {
        setIsLoadingMore(true)
      }
      
      const response = await fetch(`/api/mobile/notifications/history?customerId=${customer?.id}&page=${page}`, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_BEARER_TOKEN}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Bildirimler yüklenemedi')
      }
      
      const result = await response.json()
      
      if (page === 1) {
        setData(result)
      } else {
        // Append new notifications to existing ones
        setData(prevData => ({
          ...result,
          notifications: [...(prevData?.notifications || []), ...result.notifications]
        }))
      }
      
      setCurrentPage(page)
      
      // Refresh notification count after fetching (since reading marks as read)
      refreshNotificationCount()
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setError(error instanceof Error ? error.message : 'Bir hata oluştu')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  const loadMoreNotifications = () => {
    if (data?.pagination.hasNext && !isLoadingMore) {
      fetchNotifications(currentPage + 1)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'CAMPAIGN':
        return Gift
      case 'REWARD':
        return CheckCircle2
      case 'WARNING':
        return AlertCircle
      case 'BROADCAST':
        return Bell
      default:
        return Info
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'CAMPAIGN':
        return theme.accent
      case 'REWARD':
        return theme.success
      case 'WARNING':
        return theme.warning
      case 'BROADCAST':
        return theme.primary
      default:
        return theme.secondary
    }
  }

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Bildirimler yükleniyor..." fullScreen />
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="font-semibold text-gray-900 mb-2">Hata Oluştu</h3>
        <p className="text-gray-600 text-sm mb-4">{error}</p>
        <button
          onClick={fetchNotifications}
          className="px-4 py-2 bg-theme-primary text-white rounded-lg font-medium"
        >
          Tekrar Dene
        </button>
      </div>
    )
  }

  const notifications = data?.notifications || []

  return (
    <div className="px-4 pb-20 space-y-4">
      {/* Header Stats */}
      <div 
        className="rounded-2xl p-4 text-white shadow-lg"
        style={{ 
          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)` 
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Bildirimlerim</h2>
            <p className="text-white/80 text-sm">Sizin için gönderilen mesajlar</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
            <Bell className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{data?.pagination.total || 0}</p>
            <p className="text-white/80 text-xs">Toplam</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">
              {notifications.filter(n => n.status === 'DELIVERED').length}
            </p>
            <p className="text-white/80 text-xs">Okundu</p>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-700 mb-2">Henüz Bildirim Yok</h3>
          <p className="text-gray-500 text-sm">
            Size gönderilen bildirimler burada görünecek
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const IconComponent = getNotificationIcon(notification.type)
            const iconColor = getNotificationColor(notification.type)
            
            return (
              <div
                key={notification.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div 
                    className="flex-shrink-0 p-2 rounded-xl"
                    style={{ backgroundColor: `${iconColor}20` }}
                  >
                    <IconComponent 
                      className="w-5 h-5" 
                      style={{ color: iconColor }}
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                        {notification.title}
                      </h4>
                      <div className="flex-shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(notification.createdAt), { 
                            addSuffix: true,
                            locale: tr 
                          })}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {notification.message || notification.body}
                    </p>
                    
                    {/* Type Badge */}
                    <div className="mt-2">
                      <span 
                        className="inline-block px-2 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: iconColor }}
                      >
                        {notification.type === 'CAMPAIGN' && '🎉 Kampanya'}
                        {notification.type === 'REWARD' && '🎁 Ödül'}
                        {notification.type === 'WARNING' && '⚠️ Uyarı'}
                        {notification.type === 'BROADCAST' && '📢 Duyuru'}
                        {notification.type === 'INFO' && 'ℹ️ Bilgi'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Load More */}
      {data?.pagination.hasNext && (
        <div className="text-center pt-4">
          <button
            onClick={loadMoreNotifications}
            disabled={isLoadingMore}
            className="px-6 py-3 bg-theme-primary text-white rounded-xl font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            {isLoadingMore ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Yükleniyor...
              </>
            ) : (
              'Daha Fazla Yükle'
            )}
          </button>
        </div>
      )}
    </div>
  )
}

export default function NotificationsPage() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <MobileContainer title="Bildirimler" showBack>
          <NotificationsContent />
        </MobileContainer>
      </ThemeProvider>
    </AuthProvider>
  )
}