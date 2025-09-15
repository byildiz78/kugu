'use client'

import { toast } from 'sonner'

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  data?: {
    type: 'CAMPAIGN' | 'REWARD' | 'POINTS' | 'GENERAL'
    campaignId?: string
    rewardId?: string
    url?: string
  }
}

class WebPushService {
  private isSupported: boolean = false
  private permission: NotificationPermission = 'default'
  private registration: ServiceWorkerRegistration | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      // Temporarily disable push notifications for HTTP server
      this.isSupported = false
      this.permission = 'denied'
      
      console.log('📴 Push notifications temporarily disabled (HTTP server)')
    }
  }

  private checkEnvironment() {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidPublicKey) {
      console.warn('⚠️ VAPID public key not found. Push notifications will not work.')
      console.log('💡 Run: node scripts/generate-vapid-keys.js to generate keys')
      console.log('💡 Then add them to your .env.local file')
    } else {
      console.log('✅ VAPID public key found:', vapidPublicKey.substring(0, 20) + '...')
    }
  }

  // Check if push notifications are supported
  isNotificationSupported(): boolean {
    return this.isSupported
  }

  // Get current permission status
  getPermissionStatus(): NotificationPermission {
    return this.permission
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      throw new Error('Push notifications are not supported')
    }

    try {
      this.permission = await Notification.requestPermission()
      return this.permission
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      throw error
    }
  }

  // Register service worker
  private async registerServiceWorker(): Promise<ServiceWorkerRegistration> {
    if (this.registration) {
      return this.registration
    }

    try {
      // First check if there's already a registration
      const existingRegistration = await navigator.serviceWorker.getRegistration('/')
      if (existingRegistration) {
        console.log('Found existing service worker registration')
        this.registration = existingRegistration
        return existingRegistration
      }

      console.log('Registering new service worker...')
      const registration = await navigator.serviceWorker.register('/push-sw.js', {
        scope: '/'
      })
      
      console.log('Service Worker registered:', registration.scope)
      
      // Wait for the service worker to be ready and active
      const readyRegistration = await navigator.serviceWorker.ready
      console.log('Service Worker is ready')
      
      // Additional check to ensure we have an active worker
      if (!readyRegistration.active) {
        console.log('Waiting for service worker to become active...')
        
        // Wait up to 10 seconds for activation
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Service Worker activation timeout'))
          }, 10000)
          
          const checkActive = () => {
            if (readyRegistration.active) {
              clearTimeout(timeout)
              resolve(true)
            } else if (readyRegistration.installing || readyRegistration.waiting) {
              const worker = readyRegistration.installing || readyRegistration.waiting
              worker?.addEventListener('statechange', () => {
                if (worker.state === 'activated') {
                  clearTimeout(timeout)
                  resolve(true)
                }
              })
            } else {
              setTimeout(checkActive, 100)
            }
          }
          
          checkActive()
        })
      }
      
      console.log('✅ Service Worker is active and ready')
      this.registration = readyRegistration
      return readyRegistration
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      throw error
    }
  }

  // Get push subscription
  async getPushSubscription(): Promise<PushSubscription | null> {
    console.log('📡 Getting push subscription...')
    console.log('🔐 Is supported:', this.isSupported)
    console.log('🔐 Permission:', this.permission)
    
    if (!this.isSupported || this.permission !== 'granted') {
      console.log('❌ Push not supported or permission not granted')
      return null
    }

    try {
      console.log('📝 Registering service worker...')
      const registration = await this.registerServiceWorker()
      console.log('✅ Service worker registered:', registration.scope)
      
      // Check if already subscribed
      console.log('🔍 Checking existing subscription...')
      let subscription = await registration.pushManager.getSubscription()
      
      if (subscription) {
        console.log('✅ Found existing subscription:', subscription.endpoint)
      } else {
        console.log('📝 Creating new subscription...')
        // Create new subscription
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidPublicKey) {
          console.error('❌ VAPID public key not found in environment variables')
          throw new Error('VAPID public key not configured')
        }
        console.log('🔑 Using VAPID key:', vapidPublicKey.substring(0, 20) + '...')

        // Ensure pushManager is available
        if (!registration.pushManager) {
          throw new Error('Push messaging is not supported')
        }

        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
          })
          console.log('✅ Created new subscription:', subscription.endpoint)
        } catch (subscribeError: any) {
          console.error('❌ Failed to create subscription:', subscribeError)
          if (subscribeError.name === 'NotAllowedError') {
            throw new Error('Notification permission denied')
          } else if (subscribeError.name === 'AbortError') {
            throw new Error('Subscription was aborted. Please try again.')
          }
          throw subscribeError
        }
      }

      return subscription
    } catch (error) {
      console.error('❌ Error getting push subscription:', error)
      return null
    }
  }

  // Convert VAPID key from base64 to Uint8Array
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // Register push subscription with backend
  async registerSubscription(customerId: string): Promise<boolean> {
    try {
      console.log('🔔 Registering push subscription for customer:', customerId)
      
      const subscription = await this.getPushSubscription()
      if (!subscription) {
        console.error('❌ No push subscription available')
        return false
      }

      console.log('📡 Push subscription created:', subscription.toJSON())

      const response = await fetch('/api/mobile/notifications/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_BEARER_TOKEN}`
        },
        body: JSON.stringify({
          customerId,
          subscription: subscription.toJSON(),
          platform: 'web',
          userAgent: navigator.userAgent
        })
      })

      console.log('📝 Register API response status:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Push subscription registered successfully:', result)
        // Store subscription locally for future reference
        localStorage.setItem('push-subscription', JSON.stringify(subscription.toJSON()))
        localStorage.setItem('push-subscription-registered', 'true')
        return true
      } else {
        const errorText = await response.text()
        console.error('❌ Failed to register push subscription:', response.status, errorText)
        return false
      }
    } catch (error) {
      console.error('❌ Error registering push subscription:', error)
      return false
    }
  }

  // Setup message listener for service worker
  setupMessageListener() {
    if (!navigator.serviceWorker) return

    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('Message from service worker:', event.data)
      
      if (event.data.type === 'NOTIFICATION_CLICK') {
        // Handle notification click navigation
        if (event.data.url && typeof window !== 'undefined') {
          window.location.href = event.data.url
        }
      }
    })
  }

  // Show local notification (for testing)
  showLocalNotification(payload: NotificationPayload) {
    if (!this.isSupported || this.permission !== 'granted') {
      return
    }

    const options: NotificationOptions = {
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: payload.data?.type || 'general',
      data: payload.data,
      requireInteraction: true,
      vibrate: [200, 100, 200],
      actions: [
        {
          action: 'open',
          title: 'Aç'
        },
        {
          action: 'dismiss',
          title: 'Kapat'
        }
      ]
    }

    new Notification(payload.title, options)
  }

  // Initialize push notifications
  async initialize(customerId: string): Promise<boolean> {
    console.log('🚀 Initializing push notifications for customer:', customerId)
    
    if (!this.isSupported) {
      console.warn('❌ Push notifications not supported')
      return false
    }

    try {
      // Check current permission
      this.permission = this.getPermissionStatus()
      console.log('🔐 Current permission status:', this.permission)

      // Request permission if not already granted
      if (this.permission === 'default') {
        console.log('📋 Requesting notification permission...')
        await this.requestPermission()
        this.permission = this.getPermissionStatus()
        console.log('🔐 Permission after request:', this.permission)
      }

      if (this.permission !== 'granted') {
        console.warn('❌ Notification permission denied')
        return false
      }

      // Setup message listener
      console.log('📨 Setting up message listener...')
      this.setupMessageListener()

      // Register subscription with backend
      console.log('📝 Registering subscription with backend...')
      const registered = await this.registerSubscription(customerId)
      
      console.log('✅ Initialization result:', registered)
      return registered
    } catch (error) {
      console.error('❌ Error initializing push notifications:', error)
      return false
    }
  }

  // Unregister push subscription
  async unregisterSubscription(customerId: string): Promise<boolean> {
    try {
      const subscriptionData = localStorage.getItem('push-subscription')
      if (!subscriptionData) return true

      const response = await fetch('/api/mobile/notifications/unregister', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_BEARER_TOKEN}`
        },
        body: JSON.stringify({
          customerId,
          subscription: JSON.parse(subscriptionData)
        })
      })

      if (response.ok) {
        console.log('Push subscription unregistered successfully')
        localStorage.removeItem('push-subscription')
        localStorage.removeItem('push-subscription-registered')
        
        // Also unsubscribe from browser
        const subscription = await this.getPushSubscription()
        if (subscription) {
          await subscription.unsubscribe()
        }
        
        return true
      } else {
        console.error('Failed to unregister push subscription:', response.statusText)
        return false
      }
    } catch (error) {
      console.error('Error unregistering push subscription:', error)
      return false
    }
  }

  // Check if subscription is already registered
  isSubscriptionRegistered(): boolean {
    return localStorage.getItem('push-subscription-registered') === 'true'
  }

  // Test notification (for development)
  async sendTestNotification(customerId: string, type: 'CAMPAIGN' | 'REWARD' | 'POINTS' | 'GENERAL' = 'GENERAL') {
    try {
      const response = await fetch('/api/mobile/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_BEARER_TOKEN}`
        },
        body: JSON.stringify({
          customerId,
          type
        })
      })

      if (response.ok) {
        console.log('Test notification sent')
        toast.success('Test bildirimi gönderildi')
        return true
      } else {
        console.error('Failed to send test notification')
        toast.error('Test bildirimi gönderilemedi')
        return false
      }
    } catch (error) {
      console.error('Error sending test notification:', error)
      toast.error('Test bildirimi gönderilemedi')
      return false
    }
  }
}

export const webPushService = new WebPushService()