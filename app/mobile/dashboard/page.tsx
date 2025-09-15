'use client'

import { useEffect, useState, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { MobileContainer } from '@/components/mobile/layout/MobileContainer'
import { DashboardHeader } from '@/components/mobile/dashboard/DashboardHeader'
import { PointsCard } from '@/components/mobile/cards/PointsCard'
import { QuickStatsCard } from '@/components/mobile/cards/QuickStatsCard'
import { useAuth } from '@/lib/mobile/auth-context'
import { AuthProvider } from '@/lib/mobile/auth-context'
import { ThemeProvider, useTheme } from '@/lib/mobile/theme-context'
import { ShoppingBag, TrendingUp, Calendar, Gift, QrCode, X } from 'lucide-react'
import { ThemedButton } from '@/components/mobile/ui/ThemedButton'
import { LoadingSpinner, SkeletonCard } from '@/components/mobile/ui/LoadingSpinner'
import { useMemoryOptimizer, usePerformanceMonitor } from '@/components/mobile/ui/PerformanceOptimizer'
import { MobileBottomNav } from '@/components/mobile/layout/MobileBottomNav'
import { NotificationPrompt } from '@/components/mobile/notifications/NotificationPrompt'
import { QRCodeGenerator } from '@/components/mobile/ui/QRCodeGenerator'
import { useRouter } from 'next/navigation'

// Lazy load heavy components
const CampaignCard = dynamic(() => 
  import('@/components/mobile/cards/CampaignCard').then(mod => ({ default: mod.CampaignCard })), 
  { 
    loading: () => <SkeletonCard />,
    ssr: false 
  }
)

const RecentTransactions = dynamic(() => 
  import('@/components/mobile/dashboard/RecentTransactions').then(mod => ({ default: mod.RecentTransactions })), 
  { 
    loading: () => <SkeletonCard />,
    ssr: false 
  }
)

const StampCollection = dynamic(() => 
  import('@/components/mobile/stamps/StampCollection').then(mod => ({ default: mod.StampCollection })), 
  { 
    loading: () => <SkeletonCard />,
    ssr: false 
  }
)

function DashboardContent() {
  const { customer, isLoading: authLoading } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrTimer, setQrTimer] = useState<NodeJS.Timeout | null>(null)

  // Performance optimizations
  useMemoryOptimizer()
  usePerformanceMonitor()

  useEffect(() => {
    if (customer?.id) {
      fetchDashboardData()
    }
  }, [customer])

  const fetchDashboardData = async () => {
    try {
      // Fetch customer details with campaigns and transactions
      const response = await fetch(`/api/customers/${customer?.id}`, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_BEARER_TOKEN}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleShowQR = () => {
    setShowQRModal(true)
    
    // Auto close after 30 seconds
    const timer = setTimeout(() => {
      setShowQRModal(false)
    }, 30000)
    
    setQrTimer(timer)
  }

  const handleCloseQR = () => {
    setShowQRModal(false)
    if (qrTimer) {
      clearTimeout(qrTimer)
      setQrTimer(null)
    }
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (qrTimer) {
        clearTimeout(qrTimer)
      }
    }
  }, [qrTimer])

  if (authLoading || isLoading) {
    return <LoadingSpinner size="lg" text="Yükleniyor..." fullScreen />
  }

  const stats = [
    {
      label: 'Toplam Harcama',
      value: customer?.totalSpent || 0,
      icon: ShoppingBag,
      color: theme.primary,
      trend: { value: 12, isPositive: true }
    },
    {
      label: 'Ziyaret Sayısı',
      value: customer?.visitCount || 0,
      icon: Calendar,
      color: theme.secondary
    },
    {
      label: 'Kazanılan Puan',
      value: dashboardData?.stats?.totalPointsEarned || 0,
      icon: TrendingUp,
      color: theme.success,
      trend: { value: 8, isPositive: true }
    },
    {
      label: 'Kullanılan Ödül',
      value: dashboardData?.customer?.rewards?.filter((r: any) => r.isRedeemed).length || 0,
      icon: Gift,
      color: theme.accent
    }
  ]

  return (
    <>
      {/* Custom Header without MobileContainer wrapper */}
      <DashboardHeader />
      
      {/* Content with enhanced styling */}
      <div className="px-4 pb-20 space-y-8 relative">
        {/* Background decorations */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div 
            className="absolute top-20 right-4 w-24 h-24 rounded-full opacity-5"
            style={{ backgroundColor: theme.accent }}
          />
          <div 
            className="absolute top-64 left-4 w-16 h-16 rounded-full opacity-3"
            style={{ backgroundColor: theme.secondary }}
          />
        </div>

        {/* Notification Prompt */}
        {customer?.id && (
          <div className="-mt-8 relative z-10">
            <NotificationPrompt customerId={customer.id} />
          </div>
        )}

        {/* Points Card with enhanced margin */}
        <div className={`relative z-10 ${customer?.id ? '-mt-2' : '-mt-8'}`}>
          <PointsCard
            points={customer?.points || 0}
            tierName={customer?.tier?.name}
            tierDisplayName={customer?.tier?.displayName}
            tierColor={customer?.tier?.color}
            pointsToNextTier={customer?.tier ? 1000 : undefined}
            nextTierName={customer?.tier ? 'Next Tier' : undefined}
          />
        </div>

        {/* QR Code Button */}
        <div className="flex justify-center">
          <ThemedButton
            variant="outline"
            size="lg"
            onClick={handleShowQR}
            className="border-theme-primary text-theme-primary hover:bg-theme-primary hover:text-white flex items-center gap-2 px-8 py-3 rounded-xl shadow-lg"
          >
            <QrCode className="w-5 h-5" />
            QR Oluştur
          </ThemedButton>
        </div>

        {/* Stamp Collection - moved above stats */}
        {customer?.id && (
          <div className="space-y-4">
            <Suspense fallback={<SkeletonCard />}>
              <StampCollection customerId={customer.id} />
            </Suspense>
          </div>
        )}

        {/* Quick Stats with section title */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 px-1">
            <div 
              className="w-1 h-6 rounded-full"
              style={{ backgroundColor: theme.primary }}
            />
            <h2 className="text-xl font-bold text-theme-text-primary">
              Özet İstatistikler
            </h2>
          </div>
          <QuickStatsCard stats={stats} />
        </div>

        {/* Active Campaigns with enhanced styling */}
        {dashboardData?.availableCampaigns && dashboardData.availableCampaigns.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-1 h-6 rounded-full"
                  style={{ backgroundColor: theme.secondary }}
                />
                <h2 className="text-xl font-bold text-theme-text-primary">
                  Aktif Kampanyalar
                </h2>
                <div 
                  className="px-3 py-1 rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: theme.accent }}
                >
                  {dashboardData.availableCampaigns.length}
                </div>
              </div>
              <ThemedButton
                variant="outline"
                size="sm"
                className="border-theme-primary text-theme-primary hover:bg-theme-primary hover:text-white"
                onClick={() => router.push('/mobile/campaigns')}
              >
                Tümünü Gör
              </ThemedButton>
            </div>
            
            <Suspense fallback={<SkeletonCard />}>
              <div className="space-y-4">
                {dashboardData.availableCampaigns.slice(0, 3).map((campaign: any) => (
                  <CampaignCard
                    key={campaign.id}
                    {...campaign}
                  />
                ))}
              </div>
            </Suspense>
          </div>
        )}

        {/* Recent Transactions with enhanced styling */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 px-1">
            <div 
              className="w-1 h-6 rounded-full"
              style={{ backgroundColor: theme.success }}
            />
            <h2 className="text-xl font-bold text-theme-text-primary">
              Son İşlemler
            </h2>
          </div>
          <Suspense fallback={<SkeletonCard />}>
            {dashboardData?.customer?.transactions && (
              <RecentTransactions transactions={dashboardData.customer.transactions} />
            )}
          </Suspense>
        </div>

        {/* Bottom spacing for better UX */}
        <div className="h-8" />
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm relative animate-in fade-in-0 zoom-in-95 duration-300">
            {/* Close Button */}
            <button
              onClick={handleCloseQR}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {/* QR Code Generator */}
            <QRCodeGenerator
              data={JSON.stringify({ sessionId: customer?.id })}
              title="Müşteri QR Kodu"
              subtitle="Bu kodu kasada göstererek işlem yapabilirsiniz"
              size={200}
              showActions={false}
              className="border-0 shadow-none bg-transparent"
            />

            {/* Auto close indicator */}
            <div className="mt-4 text-center">
              <div className="text-xs text-gray-500 mb-2">
                Bu pencere 30 saniye içinde otomatik kapanacak
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-theme-primary h-1 rounded-full animate-pulse"
                  style={{ 
                    animation: 'shrink 30s linear forwards',
                    transformOrigin: 'left center'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function DashboardPage() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="min-h-screen bg-theme-background flex flex-col">
          <style jsx>{`
            @keyframes shrink {
              from {
                transform: scaleX(1);
              }
              to {
                transform: scaleX(0);
              }
            }
          `}</style>
          <main className="flex-1 pb-16">
            <DashboardContent />
          </main>
          <MobileBottomNav />
        </div>
      </ThemeProvider>
    </AuthProvider>
  )
}