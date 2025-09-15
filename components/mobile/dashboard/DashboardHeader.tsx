'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/mobile/auth-context'
import { useTheme } from '@/lib/mobile/theme-context'
import { Bell, BellOff } from 'lucide-react'
import { ThemedButton } from '@/components/mobile/ui/ThemedButton'
import { useRouter } from 'next/navigation'

export function DashboardHeader() {
  const { customer } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Günaydın'
    if (hour < 18) return 'İyi günler'
    return 'İyi akşamlar'
  }

  const handleNotificationClick = () => {
    router.push('/mobile/notifications')
  }

  return (
    <div className="relative overflow-hidden">
      {/* Background with gradient using theme colors */}
      <div 
        className="absolute inset-0 bg-gradient-to-br opacity-10"
        style={{ 
          background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 50%, var(--color-accent) 100%)` 
        }}
      />
      
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-4 right-4 w-32 h-32 rounded-full border-2 border-theme-primary"></div>
        <div className="absolute bottom-2 left-4 w-16 h-16 rounded-full border border-theme-secondary"></div>
        <div className="absolute top-1/2 right-1/4 w-8 h-8 rounded-full bg-theme-accent"></div>
      </div>

      <div className="relative bg-theme-surface px-4 py-8 pb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            {/* Logo with enhanced styling */}
            {theme.logo && (
              <div className="mb-4 p-2 bg-white/80 rounded-xl w-fit shadow-sm">
                <img 
                  src={theme.logo} 
                  alt={customer?.restaurant?.name || 'Logo'} 
                  className="h-8 object-contain"
                />
              </div>
            )}
            
            {/* Enhanced Greeting */}
            <div className="mb-3">
              <h1 className="text-3xl font-bold text-theme-text-primary mb-1">
                {getGreeting()}
              </h1>
              <div className="flex items-center space-x-2">
                <span 
                  className="text-2xl font-semibold"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {customer?.name?.split(' ')[0] || 'Misafir'}
                </span>
                <span className="text-2xl">👋</span>
              </div>
            </div>
            
            {/* Welcome message with theme accent */}
            <div className="flex items-center space-x-2">
              <div 
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: 'var(--color-accent)' }}
              />
              <p className="text-theme-text-secondary font-medium">
               Kuğu Pastanesi sadakat programına hoş geldiniz
              </p>
            </div>
          </div>

          {/* Notification Button - Navigate to notifications page */}
          <div className="flex flex-col items-center space-y-2">
            <ThemedButton
              variant="ghost"
              size="sm"
              className="relative bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg"
              onClick={handleNotificationClick}
            >
              <Bell className="w-5 h-5 text-theme-primary" />
            </ThemedButton>
            
            <span className="text-xs text-theme-text-secondary text-center">
              Bildirimler
            </span>
          </div>
        </div>

      </div>
    </div>
  )
}