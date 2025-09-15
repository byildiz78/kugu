'use client'

import { ReactNode } from 'react'

interface AnalyticsLayoutProps {
  children: ReactNode
}

export function AnalyticsLayout({ children }: AnalyticsLayoutProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              📊 Sadakat Analizi
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Müşteri davranışları, kampanya performansı ve sadakat programı etkilerinin detaylı analizi
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-500">Canlı Veri</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {children}
      </div>
    </div>
  )
}