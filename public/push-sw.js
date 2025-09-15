// Native Web Push Service Worker
console.log('[push-sw.js] Service Worker loaded')

// Listen for push events
self.addEventListener('push', (event) => {
  console.log('[push-sw.js] Push event received:', event)

  let data = {}
  if (event.data) {
    try {
      const text = event.data.text()
      console.log('[push-sw.js] Raw push data:', text)
      data = JSON.parse(text)
      console.log('[push-sw.js] Parsed push data:', data)
    } catch (error) {
      console.error('[push-sw.js] Error parsing push data:', error)
      data = { title: 'Air CRM', body: 'Yeni bir bildiriminiz var' }
    }
  } else {
    console.log('[push-sw.js] No data in push event')
    data = { title: 'Air CRM', body: 'Yeni bir bildiriminiz var' }
  }

  const title = data.title || 'Air CRM'
  const options = {
    body: data.body || 'Yeni bir bildiriminiz var',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: data.type || 'general',
    data: data,
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

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  console.log('[push-sw.js] Notification click received:', event.notification.tag)

  event.notification.close()

  if (event.action === 'dismiss') {
    return
  }

  // Handle different notification types
  const data = event.notification.data
  let url = '/mobile/dashboard'

  if (data?.type === 'CAMPAIGN') {
    url = `/mobile/campaigns/${data.campaignId || ''}`
  } else if (data?.type === 'REWARD') {
    url = `/mobile/rewards/${data.rewardId || ''}`
  } else if (data?.type === 'POINTS') {
    url = '/mobile/profile'
  } else if (data?.url) {
    url = data.url
  }

  // Open the app and navigate to the appropriate page
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if the app is already open
      for (const client of clientList) {
        if (client.url.includes('/mobile') && 'focus' in client) {
          client.focus()
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            url: url,
            data: data
          })
          return
        }
      }

      // If app is not open, open a new window
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

// Handle notification close events
self.addEventListener('notificationclose', (event) => {
  console.log('[push-sw.js] Notification closed:', event.notification.tag)
  
  // Track notification dismissal if needed
  // You can send analytics data here
})

// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('[push-sw.js] Service Worker installing')
  self.skipWaiting()
})

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('[push-sw.js] Service Worker activating')
  event.waitUntil(clients.claim())
})