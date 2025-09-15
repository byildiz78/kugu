'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/mobile/auth-context'

interface NotificationCount {
  total: number
  unread: number
}

export function useNotifications() {
  const { customer } = useAuth()
  const [count, setCount] = useState<NotificationCount>({ total: 0, unread: 0 })
  const [isLoading, setIsLoading] = useState(false)

  const fetchNotificationCount = async () => {
    if (!customer?.id) return

    try {
      setIsLoading(true)
      const response = await fetch(
        `/api/mobile/notifications/count?customerId=${customer.id}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_BEARER_TOKEN}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setCount(data)
      }
    } catch (error) {
      console.error('Error fetching notification count:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotificationCount()
    
    // Refresh count every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000)
    
    return () => clearInterval(interval)
  }, [customer?.id])

  return {
    count,
    isLoading,
    refresh: fetchNotificationCount
  }
}