import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Suspense } from 'react'
import '@/app/mobile.css' // Import mobile-specific CSS
import ErrorBoundary from '@/components/mobile/ui/ErrorBoundary'
import { SuspenseFallback } from '@/components/mobile/ui/LoadingSpinner'
import { GlobalErrorHandler } from '@/components/mobile/ui/GlobalErrorHandler'
import { ToastProvider } from '@/components/mobile/ui/Toast'
import { AccessibilityProvider, SkipLink } from '@/components/mobile/ui/AccessibilityProvider'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: 'Air CRM - Sadakat Programı',
  description: 'Sadakat puanlarınızı takip edin, kampanyalardan haberdar olun',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Air CRM',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Air CRM',
    title: 'Air CRM - Sadakat Programı',
    description: 'Sadakat puanlarınızı takip edin, kampanyalardan haberdar olun',
  },
  twitter: {
    card: 'summary',
    title: 'Air CRM - Sadakat Programı',
    description: 'Sadakat puanlarınızı takip edin, kampanyalardan haberdar olun',
  },
}


export default function MobileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-gray-50 min-h-screen antialiased font-inter">
      <SkipLink />
      <GlobalErrorHandler>
        <AccessibilityProvider>
          <ToastProvider>
            <ErrorBoundary>
              <Suspense fallback={<SuspenseFallback />}>
                <div className="mobile-app">
                  <main id="main-content">
                    {children}
                  </main>
                </div>
              </Suspense>
            </ErrorBoundary>
          </ToastProvider>
        </AccessibilityProvider>
      </GlobalErrorHandler>
    </div>
  )
}