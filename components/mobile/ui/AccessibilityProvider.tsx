'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface AccessibilitySettings {
  reducedMotion: boolean
  highContrast: boolean
  largeText: boolean
  screenReader: boolean
}

interface AccessibilityContextType {
  settings: AccessibilitySettings
  updateSettings: (settings: Partial<AccessibilitySettings>) => void
  announceToScreenReader: (message: string) => void
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null)

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider')
  }
  return context
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    reducedMotion: false,
    highContrast: false,
    largeText: false,
    screenReader: false
  })

  useEffect(() => {
    // Detect system preferences
    const detectPreferences = () => {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const highContrast = window.matchMedia('(prefers-contrast: high)').matches
      const largeText = window.matchMedia('(min-resolution: 120dpi)').matches

      setSettings(prev => ({
        ...prev,
        reducedMotion,
        highContrast,
        largeText
      }))

      // Apply CSS classes based on preferences
      document.documentElement.classList.toggle('reduced-motion', reducedMotion)
      document.documentElement.classList.toggle('high-contrast', highContrast)
      document.documentElement.classList.toggle('large-text', largeText)
    }

    detectPreferences()

    // Listen for changes
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const contrastQuery = window.matchMedia('(prefers-contrast: high)')
    
    motionQuery.addEventListener('change', detectPreferences)
    contrastQuery.addEventListener('change', detectPreferences)

    return () => {
      motionQuery.removeEventListener('change', detectPreferences)
      contrastQuery.removeEventListener('change', detectPreferences)
    }
  }, [])

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }

  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    
    document.body.appendChild(announcement)
    
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  return (
    <AccessibilityContext.Provider value={{ settings, updateSettings, announceToScreenReader }}>
      {children}
      <ScreenReaderAnnouncements />
    </AccessibilityContext.Provider>
  )
}

// Screen reader announcements component
function ScreenReaderAnnouncements() {
  return (
    <div className="sr-only" aria-live="polite" aria-atomic="true" id="sr-announcements" />
  )
}

// Accessible focus management hook
export function useFocusManagement() {
  const trapFocus = (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)
    
    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }

  const restoreFocus = (element: HTMLElement) => {
    return () => {
      element.focus()
    }
  }

  return { trapFocus, restoreFocus }
}

// Skip link component
export function SkipLink({ href = '#main-content', children = 'İçeriğe geç' }: {
  href?: string
  children?: React.ReactNode
}) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-theme-primary focus:text-white focus:rounded-theme focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-theme-primary-light"
    >
      {children}
    </a>
  )
}

// Accessible heading component
export function AccessibleHeading({ 
  level, 
  children, 
  className = '',
  id
}: {
  level: 1 | 2 | 3 | 4 | 5 | 6
  children: React.ReactNode
  className?: string
  id?: string
}) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements

  return (
    <Tag 
      id={id} 
      className={`font-theme-heading font-semibold text-theme-text-primary ${className}`}
    >
      {children}
    </Tag>
  )
}

// Accessible button component
export function AccessibleButton({
  children,
  onClick,
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  className = '',
  variant = 'primary',
  ...props
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  ariaLabel?: string
  ariaDescribedBy?: string
  className?: string
  variant?: 'primary' | 'secondary' | 'outline'
  [key: string]: any
}) {
  const { announceToScreenReader } = useAccessibility()

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick()
      
      // Announce action to screen readers
      if (ariaLabel) {
        announceToScreenReader(`${ariaLabel} butonuna basıldı`)
      }
    }
  }

  const baseClasses = `
    focus-ring transition-all-smooth
    px-4 py-2 rounded-theme font-medium
    disabled:opacity-50 disabled:cursor-not-allowed
  `

  const variantClasses = {
    primary: 'bg-theme-primary text-white hover:bg-theme-primary-dark',
    secondary: 'bg-theme-secondary text-white hover:opacity-90',
    outline: 'border-2 border-theme-primary text-theme-primary hover:bg-theme-primary hover:text-white'
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

// Accessible form field component
export function AccessibleFormField({
  label,
  id,
  error,
  helper,
  required = false,
  children
}: {
  label: string
  id: string
  error?: string
  helper?: string
  required?: boolean
  children: React.ReactNode
}) {
  const errorId = error ? `${id}-error` : undefined
  const helperId = helper ? `${id}-helper` : undefined
  const describedBy = [errorId, helperId].filter(Boolean).join(' ')

  return (
    <div className="space-y-2">
      <label 
        htmlFor={id}
        className="block text-sm font-medium text-theme-text-primary"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="gerekli">*</span>
        )}
      </label>
      
      <div className="relative">
        {React.cloneElement(children as React.ReactElement, {
          id,
          'aria-describedby': describedBy || undefined,
          'aria-invalid': error ? 'true' : 'false',
          'aria-required': required
        })}
      </div>

      {helper && (
        <p id={helperId} className="text-xs text-theme-text-secondary">
          {helper}
        </p>
      )}

      {error && (
        <p 
          id={errorId} 
          className="text-xs text-red-500"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  )
}

// ARIA live region for dynamic content
export function LiveRegion({ 
  children,
  level = 'polite',
  atomic = true
}: {
  children: React.ReactNode
  level?: 'polite' | 'assertive'
  atomic?: boolean
}) {
  return (
    <div
      aria-live={level}
      aria-atomic={atomic}
      className="sr-only"
    >
      {children}
    </div>
  )
}