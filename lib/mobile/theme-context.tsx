'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { ThemeConfig, defaultTheme, getRestaurantTheme, applyTheme } from '@/lib/theme-config'
import { useAuth } from '@/lib/mobile/auth-context'

interface ThemeContextType {
  theme: ThemeConfig
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { customer } = useAuth()
  const [theme, setTheme] = useState<ThemeConfig>(defaultTheme)
  const [isLoading, setIsLoading] = useState(true)
  const [lastThemeId, setLastThemeId] = useState<string | null>(null)

  const loadTheme = async () => {
    setIsLoading(true)
    
    try {
      // Try to fetch default theme from database first
      // Use relative URL to work on any domain
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const response = await fetch(`${baseUrl}/api/mobile/theme/default?` + Date.now()) // Cache bust
      
      if (response.ok) {
        const data = await response.json()
        if (data.theme && data.theme.config) {
          // Sadece tema değiştiyse güncelle
          if (data.theme.id !== lastThemeId) {
            console.log('Yeni tema yükleniyor:', data.theme.name)
            setTheme(data.theme.config)
            applyTheme(data.theme.config)
            setLastThemeId(data.theme.id)
          } else {
            console.log('Tema değişmedi, güncelleme atlandı:', data.theme.name)
          }
          return
        }
      } else {
        console.warn('Theme API request failed:', response.status, response.statusText)
      }

      // Fallback: use customer-specific theme or default
      if (customer?.restaurant) {
        // Try customer's specific theme
        if ((customer as any).theme) {
          setTheme((customer as any).theme.config)
          applyTheme((customer as any).theme.config)
        } else {
          // Use mock restaurant theme
          const restaurantTheme = getRestaurantTheme(customer.restaurant.name.toLowerCase().replace(/\s+/g, '-'))
          setTheme(restaurantTheme)
          applyTheme(restaurantTheme)
        }
      } else {
        // Use default theme
        setTheme(defaultTheme)
        applyTheme(defaultTheme)
      }
    } catch (error) {
      console.error('Failed to load theme:', error)
      setTheme(defaultTheme)
      applyTheme(defaultTheme)
    } finally {
      setIsLoading(false)
    }
  }

  // Her 2 saniyede bir database'den tema kontrol et
  useEffect(() => {
    loadTheme()
    
    // Polling interval - her 30 saniyede tema kontrol et (daha az aggressive)
    const interval = setInterval(() => {
      loadTheme()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [customer])

  const value = {
    theme,
    isLoading
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}