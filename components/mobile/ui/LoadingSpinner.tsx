'use client'

import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  text?: string
  fullScreen?: boolean
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6', 
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
}

export function LoadingSpinner({ 
  size = 'md', 
  className = '', 
  text,
  fullScreen = false 
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-theme-primary`} />
      {text && (
        <p className="text-sm text-theme-text-secondary animate-pulse">
          {text}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-theme-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-theme-surface p-6 rounded-theme shadow-theme">
          {spinner}
        </div>
      </div>
    )
  }

  return spinner
}

// Skeleton loader for cards
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-theme-surface rounded-theme p-4 space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-5/6" />
      </div>
    </div>
  )
}

// Loading overlay for interactive elements
export function LoadingOverlay({ 
  isLoading, 
  children,
  className = ''
}: {
  isLoading: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`relative ${className}`}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-theme">
          <LoadingSpinner size="sm" />
        </div>
      )}
    </div>
  )
}

// Suspense fallback
export function SuspenseFallback() {
  return (
    <div className="min-h-screen bg-theme-background flex items-center justify-center">
      <LoadingSpinner size="lg" text="Yükleniyor..." />
    </div>
  )
}