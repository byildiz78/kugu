/**
 * Theme Configuration System
 * Allows restaurants to customize their mobile app appearance
 */

export interface ThemeConfig {
  // Brand Colors
  primary: string
  primaryDark: string
  primaryLight: string
  secondary: string
  accent: string
  
  // UI Colors
  background: string
  surface: string
  error: string
  warning: string
  success: string
  info: string
  
  // Text Colors
  textPrimary: string
  textSecondary: string
  textDisabled: string
  
  // Brand Assets
  logo?: string
  logoLight?: string // For dark backgrounds
  favicon?: string
  
  // Typography
  fontFamily?: string
  headingFontFamily?: string
  
  // Border Radius
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  
  // Shadows
  shadowStyle: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  
  // Contact Information
  contact_information?: string // HTML content for contact page
}

// Default Air CRM Theme
export const defaultTheme: ThemeConfig = {
  // Brand Colors
  primary: '#3b82f6', // blue-500
  primaryDark: '#2563eb', // blue-600
  primaryLight: '#60a5fa', // blue-400
  secondary: '#8b5cf6', // violet-500
  accent: '#f59e0b', // amber-500
  
  // UI Colors
  background: '#f9fafb', // gray-50
  surface: '#ffffff',
  error: '#ef4444', // red-500
  warning: '#f59e0b', // amber-500
  success: '#10b981', // emerald-500
  info: '#3b82f6', // blue-500
  
  // Text Colors
  textPrimary: '#111827', // gray-900
  textSecondary: '#6b7280', // gray-500
  textDisabled: '#d1d5db', // gray-300
  
  // Brand Assets
  logo: '/logos/aircrm-logo.png',
  logoLight: '/logos/aircrm-logo-light.png',
  favicon: '/favicon.ico',
  
  // Typography
  fontFamily: 'Inter, system-ui, sans-serif',
  headingFontFamily: 'Inter, system-ui, sans-serif',
  
  // Border Radius
  borderRadius: 'lg',
  
  // Shadows
  shadowStyle: 'md',
  
  // Contact Information
  contact_information: `
    <div class="space-y-4">
      <div>
        <h3 class="font-semibold text-lg mb-2">İletişim Bilgileri</h3>
        <p class="text-gray-600">Bizimle iletişime geçin!</p>
      </div>
      
      <div class="space-y-2">
        <div class="flex items-center space-x-3">
          <span class="font-medium">📧 E-posta:</span>
          <span>info@restaurant.com</span>
        </div>
        <div class="flex items-center space-x-3">
          <span class="font-medium">📞 Telefon:</span>
          <span>+90 212 555 0123</span>
        </div>
        <div class="flex items-center space-x-3">
          <span class="font-medium">📍 Adres:</span>
          <span>İstanbul, Türkiye</span>
        </div>
      </div>
      
      <div class="mt-4">
        <p class="text-sm text-gray-500">
          Çalışma Saatleri: Pazartesi-Pazar 09:00-22:00
        </p>
      </div>
    </div>
  `
}

// Example Restaurant Themes
export const restaurantThemes: Record<string, Partial<ThemeConfig>> = {
  'burger-king': {
    primary: '#d62300',
    primaryDark: '#8b0000',
    primaryLight: '#ff6347',
    secondary: '#f28500',
    accent: '#ffcc00',
    logo: '/logos/burger-king.png',
    borderRadius: 'xl',
    shadowStyle: 'lg'
  },
  'starbucks': {
    primary: '#00704a',
    primaryDark: '#00563f',
    primaryLight: '#00a862',
    secondary: '#27251f',
    accent: '#cba258',
    logo: '/logos/starbucks.png',
    borderRadius: 'full',
    shadowStyle: 'sm'
  },
  'mcdonalds': {
    primary: '#ffbc0d',
    primaryDark: '#e67e22',
    primaryLight: '#ffd700',
    secondary: '#da291c',
    accent: '#27251f',
    logo: '/logos/mcdonalds.png',
    borderRadius: 'lg',
    shadowStyle: 'md'
  }
}

/**
 * Get theme for a restaurant
 */
export function getRestaurantTheme(restaurantId?: string): ThemeConfig {
  if (!restaurantId) return defaultTheme
  
  const customTheme = restaurantThemes[restaurantId]
  if (!customTheme) return defaultTheme
  
  // Merge with default theme
  return {
    ...defaultTheme,
    ...customTheme
  }
}

/**
 * Convert theme config to CSS variables
 */
export function themeToCssVariables(theme: ThemeConfig): Record<string, string> {
  return {
    '--color-primary': theme.primary,
    '--color-primary-dark': theme.primaryDark,
    '--color-primary-light': theme.primaryLight,
    '--color-secondary': theme.secondary,
    '--color-accent': theme.accent,
    '--color-background': theme.background,
    '--color-surface': theme.surface,
    '--color-error': theme.error,
    '--color-warning': theme.warning,
    '--color-success': theme.success,
    '--color-info': theme.info,
    '--color-text-primary': theme.textPrimary,
    '--color-text-secondary': theme.textSecondary,
    '--color-text-disabled': theme.textDisabled,
    '--font-family': theme.fontFamily || 'inherit',
    '--font-family-heading': theme.headingFontFamily || theme.fontFamily || 'inherit',
    '--border-radius': getBorderRadiusValue(theme.borderRadius),
    '--shadow-style': getShadowValue(theme.shadowStyle)
  }
}

/**
 * Get border radius value
 */
function getBorderRadiusValue(radius: ThemeConfig['borderRadius']): string {
  const values = {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px'
  }
  return values[radius]
}

/**
 * Get shadow value
 */
function getShadowValue(shadow: ThemeConfig['shadowStyle']): string {
  const values = {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  }
  return values[shadow]
}

/**
 * Apply theme to document (mobile app only)
 */
export function applyTheme(theme: ThemeConfig): void {
  // Only run in browser context
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }
  
  // Check if current path is admin and prevent theme application
  if (window.location.pathname.startsWith('/admin')) {
    console.warn('applyTheme: Admin path detected, skipping theme application')
    return
  }
  
  // Check if we're in admin context and prevent theme application there
  const adminApp = document.querySelector('.admin-app')
  if (adminApp) {
    console.warn('applyTheme: Admin context detected, skipping theme application')
    return
  }
  
  // Only apply if we're in mobile app context
  const mobileApp = document.querySelector('.mobile-app')
  if (!mobileApp) {
    console.warn('applyTheme: Mobile app context not found, skipping theme application')
    return
  }
  
  const cssVars = themeToCssVariables(theme)
  
  // Apply CSS variables to :root with mobile- prefix only
  const root = document.documentElement
  Object.entries(cssVars).forEach(([key, value]) => {
    const mobileKey = `--mobile-${key.replace('--', '')}`
    root.style.setProperty(mobileKey, value)
  })
  
  console.log('Theme applied successfully to mobile app:', theme.primary)
}