'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { verifyMobileToken } from '@/lib/mobile-auth'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  points: number
  level: string
  totalSpent: number
  visitCount: number
  birthDate?: string
  address?: string
  city?: string
  district?: string
  tier?: {
    id: string
    name: string
    displayName: string
    color: string
    pointMultiplier: number
  }
  restaurant?: {
    name: string
  }
  rewards?: {
    id: string
    isRedeemed: boolean
    redeemedAt?: string
    expiresAt?: string
  }[]
  campaignUsages?: {
    id: string
    campaignId: string
    usedAt: string
    orderAmount: number
    discountAmount: number
  }[]
  createdAt?: string
}

interface AuthContextType {
  customer: Customer | null
  isLoading: boolean
  isAuthenticated: boolean
  logout: () => void
  refreshAuth: () => Promise<void>
  refreshCustomer: () => Promise<void>
  updateCustomer: (updatedCustomer: Customer) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/mobile/auth/me', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.customer) {
          setCustomer(data.customer)
        } else {
          setCustomer(null)
        }
      } else {
        setCustomer(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setCustomer(null)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/mobile/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setCustomer(null)
      window.location.href = '/mobile/auth/phone'
    }
  }

  const refreshAuth = async () => {
    await checkAuth()
  }

  const updateCustomer = (updatedCustomer: Customer) => {
    setCustomer(updatedCustomer)
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const value = {
    customer,
    isLoading,
    isAuthenticated: !!customer,
    logout,
    refreshAuth,
    refreshCustomer: refreshAuth,
    updateCustomer
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}