/**
 * Global theme event system
 * Allows admin panel to notify mobile app about theme changes
 */

export const THEME_EVENTS = {
  THEME_UPDATED: 'theme-updated',
  THEME_SET_DEFAULT: 'theme-set-default'
} as const

export type ThemeEventType = typeof THEME_EVENTS[keyof typeof THEME_EVENTS]

export interface ThemeUpdateEvent {
  type: ThemeEventType
  themeId?: string
  themeName?: string
  isDefault?: boolean
}

/**
 * Broadcast theme update to all windows/tabs
 */
export function broadcastThemeUpdate(event: ThemeUpdateEvent) {
  if (typeof window === 'undefined') return

  // Use minimal data to avoid localStorage quota issues
  const eventData = {
    type: event.type,
    themeId: event.themeId,
    themeName: event.themeName,
    isDefault: event.isDefault,
    timestamp: Date.now()
  }

  try {
    localStorage.setItem('theme-event', JSON.stringify(eventData))
    
    // Remove after broadcast to avoid stale events
    setTimeout(() => {
      localStorage.removeItem('theme-event')
    }, 100)
  } catch (error) {
    console.warn('Failed to store theme event in localStorage:', error)
  }

  // Also dispatch window event for same-tab communication
  window.dispatchEvent(new CustomEvent('theme-update', { detail: eventData }))
}

/**
 * Listen for theme updates from other tabs/windows
 */
export function listenForThemeUpdates(callback: (event: ThemeUpdateEvent) => void) {
  if (typeof window === 'undefined') return () => {}

  // Listen for localStorage changes (cross-tab)
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'theme-event' && e.newValue) {
      try {
        const eventData = JSON.parse(e.newValue)
        callback(eventData)
      } catch (error) {
        console.error('Failed to parse theme event:', error)
      }
    }
  }

  // Listen for custom events (same-tab)
  const handleCustomEvent = (e: CustomEvent) => {
    callback(e.detail)
  }

  window.addEventListener('storage', handleStorageChange)
  window.addEventListener('theme-update', handleCustomEvent as EventListener)

  // Cleanup function
  return () => {
    window.removeEventListener('storage', handleStorageChange)
    window.removeEventListener('theme-update', handleCustomEvent as EventListener)
  }
}

/**
 * Convenience functions for common theme events
 */
export const themeEvents = {
  themeUpdated: (themeId: string, themeName: string, isDefault = false) => {
    broadcastThemeUpdate({
      type: THEME_EVENTS.THEME_UPDATED,
      themeId,
      themeName,
      isDefault
    })
  },

  themeSetDefault: (themeId: string, themeName: string) => {
    broadcastThemeUpdate({
      type: THEME_EVENTS.THEME_SET_DEFAULT,
      themeId,
      themeName,
      isDefault: true
    })
  }
}