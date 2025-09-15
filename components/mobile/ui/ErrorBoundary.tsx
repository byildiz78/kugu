'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { ThemedButton } from './ThemedButton'
import { ThemedCard } from './ThemedCard'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{error?: Error; resetError: () => void}>
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { contexts: { errorBoundary: errorInfo } })
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error} resetError={this.resetError} />
    }

    return this.props.children
  }
}

// Default error fallback component
function DefaultErrorFallback({
  error,
  resetError
}: {
  error?: Error
  resetError: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-theme-background">
      <ThemedCard className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        
        <h2 className="text-lg font-semibold text-theme-text-primary mb-2">
          Bir şeyler ters gitti
        </h2>
        
        <p className="text-theme-text-secondary text-sm mb-6">
          Beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.
        </p>

        {process.env.NODE_ENV === 'development' && error && (
          <div className="text-left bg-gray-100 p-3 rounded-lg mb-4 text-xs text-gray-600 overflow-auto max-h-32">
            <strong>Error:</strong> {error.message}
            {error.stack && (
              <pre className="mt-2 whitespace-pre-wrap">{error.stack}</pre>
            )}
          </div>
        )}

        <div className="space-y-3">
          <ThemedButton
            variant="primary"
            onClick={resetError}
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tekrar Dene
          </ThemedButton>
          
          <ThemedButton
            variant="outline"
            onClick={() => window.location.href = '/mobile/dashboard'}
            className="w-full"
          >
            Ana Sayfaya Dön
          </ThemedButton>
        </div>
      </ThemedCard>
    </div>
  )
}

// Hook for error boundary reset
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Unhandled error:', error, errorInfo)
    
    // In production, report to error service
    if (process.env.NODE_ENV === 'production') {
      // Report error to service
    }
  }
}

export default ErrorBoundary