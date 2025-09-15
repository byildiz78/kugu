'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Global error types
export type ErrorType = 
  | 'NETWORK_ERROR'
  | 'AUTH_ERROR' 
  | 'VALIDATION_ERROR'
  | 'PERMISSION_ERROR'
  | 'SYSTEM_ERROR'

export interface AppError {
  type: ErrorType
  message: string
  code?: string | number
  details?: any
  timestamp: Date
}

// Error logging service
class ErrorLogger {
  private errors: AppError[] = []
  private maxErrors = 50

  log(error: AppError) {
    this.errors.unshift(error)
    
    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors)
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('App Error:', error)
    }

    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error)
    }
  }

  private async reportError(error: AppError) {
    try {
      // Example: Send to error reporting service
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(error)
      // })
    } catch (e) {
      console.error('Failed to report error:', e)
    }
  }

  getRecentErrors(): AppError[] {
    return [...this.errors]
  }

  clear() {
    this.errors = []
  }
}

export const errorLogger = new ErrorLogger()

// Error factory functions
export function createNetworkError(message: string, details?: any): AppError {
  return {
    type: 'NETWORK_ERROR',
    message,
    details,
    timestamp: new Date()
  }
}

export function createAuthError(message: string, code?: string): AppError {
  return {
    type: 'AUTH_ERROR',
    message,
    code,
    timestamp: new Date()
  }
}

export function createValidationError(message: string, details?: any): AppError {
  return {
    type: 'VALIDATION_ERROR',
    message,
    details,
    timestamp: new Date()
  }
}

export function createSystemError(message: string, error?: Error): AppError {
  return {
    type: 'SYSTEM_ERROR',
    message,
    details: error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : undefined,
    timestamp: new Date()
  }
}

// Error handling hooks
export function useErrorHandler() {
  const router = useRouter()

  const handleError = (error: AppError) => {
    errorLogger.log(error)

    // Handle specific error types
    switch (error.type) {
      case 'AUTH_ERROR':
        // Redirect to login
        router.push('/mobile/auth')
        break
      
      case 'PERMISSION_ERROR':
        // Show permission denied message
        break
      
      case 'NETWORK_ERROR':
        // Show network error toast
        break
      
      default:
        // Show generic error message
        break
    }
  }

  return { handleError, errorLogger }
}

// Network error handler
export function useNetworkErrorHandler() {
  const { handleError } = useErrorHandler()

  const handleNetworkError = async (response: Response) => {
    let errorMessage = 'Bir hata oluştu'
    
    if (response.status === 401) {
      errorMessage = 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.'
      handleError(createAuthError(errorMessage, '401'))
      return
    }
    
    if (response.status === 403) {
      errorMessage = 'Bu işlem için yetkiniz bulunmuyor.'
      handleError(createValidationError(errorMessage))
      return
    }
    
    if (response.status >= 500) {
      errorMessage = 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.'
    } else if (response.status >= 400) {
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // Use default message
      }
    }

    handleError(createNetworkError(errorMessage, {
      status: response.status,
      url: response.url
    }))
  }

  return { handleNetworkError }
}

// Enhanced fetch wrapper with error handling
export async function fetchWithErrorHandling(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      // Network error
      throw createNetworkError('İnternet bağlantınızı kontrol edin')
    }
    
    if (error instanceof Error) {
      throw createSystemError(error.message, error)
    }
    
    throw createSystemError('Bilinmeyen bir hata oluştu')
  }
}

// Global error boundary component
export function GlobalErrorHandler({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      errorLogger.log(createSystemError(
        'Unhandled Promise Rejection',
        event.reason instanceof Error ? event.reason : new Error(String(event.reason))
      ))
    }

    // Handle uncaught errors
    const handleError = (event: ErrorEvent) => {
      errorLogger.log(createSystemError(
        'Uncaught Error',
        event.error instanceof Error ? event.error : new Error(event.message)
      ))
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [])

  return <>{children}</>
}