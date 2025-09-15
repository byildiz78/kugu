'use client'

import { useEffect, useCallback, useState } from 'react'
import dynamic from 'next/dynamic'

// Memory optimization hook
export function useMemoryOptimizer() {
  const cleanupMemory = useCallback(() => {
    // Clear any unused timers
    if (typeof window !== 'undefined') {
      // Force garbage collection if available (dev only)
      if (process.env.NODE_ENV === 'development' && 'gc' in window) {
        try {
          ;(window as any).gc()
        } catch (e) {
          // Ignore gc errors
        }
      }
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(cleanupMemory, 60000) // Every minute
    
    return () => {
      clearInterval(interval)
    }
  }, [cleanupMemory])

  return { cleanupMemory }
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options?: IntersectionObserverInit
) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, ...options }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => observer.disconnect()
  }, [elementRef, options])

  return isVisible
}

// Performance monitoring
export function usePerformanceMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Monitor Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          console.log('LCP:', entry.startTime)
        }
        if (entry.entryType === 'first-input') {
          console.log('FID:', (entry as any).processingStart - entry.startTime)
        }
        if (entry.entryType === 'layout-shift') {
          if (!(entry as any).hadRecentInput) {
            console.log('CLS:', (entry as any).value)
          }
        }
      }
    })

    observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] })

    return () => observer.disconnect()
  }, [])
}

// Bundle optimizer - dynamic imports wrapper
export function dynamicImport<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: () => JSX.Element
) {
  return dynamic(importFn as any, {
    loading: fallback || (() => <div className="animate-pulse bg-gray-200 h-8 rounded" />),
    ssr: false,
  })
}

// Image preloader
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

// Resource hints component
export function ResourceHints() {
  return (
    <>
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    </>
  )
}