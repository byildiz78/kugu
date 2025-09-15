'use client'

import { useState, useEffect } from 'react'
import { AnalyticsLayout } from '@/components/admin/analytics/layout/AnalyticsLayout'
import { AnalyticsHeader } from '@/components/admin/analytics/layout/AnalyticsHeader'
import { AnalyticsKPICards } from '@/components/admin/analytics/overview/AnalyticsKPICards'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Import individual widgets
import { TopCustomersWidget } from '@/components/admin/analytics/widgets/TopCustomersWidget'
import { CampaignPerformanceWidget } from '@/components/admin/analytics/widgets/CampaignPerformanceWidget'
import { PointAnalyticsWidget } from '@/components/admin/analytics/widgets/PointAnalyticsWidget'
import { CustomerBehaviorWidget } from '@/components/admin/analytics/widgets/CustomerBehaviorWidget'
import { RevenueAnalyticsWidget } from '@/components/admin/analytics/widgets/RevenueAnalyticsWidget'
import { SegmentPerformanceWidget } from '@/components/admin/analytics/widgets/SegmentPerformanceWidget'

interface AnalyticsData {
  overview: {
    totalCustomers: number
    activeCustomers: number
    customerRetentionRate: number
    averageLifetimeValue: number
    totalPointsIssued: number
    totalPointsRedeemed: number
    pointBurnRate: number
    campaignROI: number
  }
  dateRange: {
    start: Date
    end: Date
  }
}

const widgetOptions = [
  { value: 'top-customers', label: 'En İyi Müşteriler', component: TopCustomersWidget },
  { value: 'campaign-performance', label: 'Kampanya Performansı', component: CampaignPerformanceWidget },
  { value: 'point-analytics', label: 'Puan Analizi', component: PointAnalyticsWidget },
  { value: 'customer-behavior', label: 'Müşteri Davranışı', component: CustomerBehaviorWidget },
  { value: 'revenue-analytics', label: 'Gelir Analizi', component: RevenueAnalyticsWidget },
  { value: 'segment-performance', label: 'Segment Performansı', component: SegmentPerformanceWidget },
]

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedWidget, setSelectedWidget] = useState('top-customers')
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date()
  })
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString()
      })

      const response = await fetch(`/api/analytics/dashboard?${params}`)
      if (!response.ok) throw new Error('Failed to fetch analytics data')
      
      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('Analiz verileri yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [dateRange, refreshKey])

  const handleDateRangeChange = (start: Date, end: Date) => {
    setDateRange({ start, end })
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
        format: 'xlsx'
      })

      const response = await fetch(`/api/analytics/export?${params}`)
      if (!response.ok) throw new Error('Export failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-${dateRange.start.toISOString().split('T')[0]}-${dateRange.end.toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Analiz raporu başarıyla indirildi')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Rapor indirme işleminde hata oluştu')
    }
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <AnalyticsLayout>
      <div className="space-y-6">
        {/* Header with filters and actions */}
        <AnalyticsHeader
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          onRefresh={handleRefresh}
          onExport={handleExport}
          loading={loading}
        />

        {/* KPI Overview Cards */}
        {data && (
          <AnalyticsKPICards 
            overview={data.overview}
            loading={loading}
          />
        )}

        {/* Widget Selector and Display */}
        <div className="space-y-6">
          {/* Widget Dropdown Selector */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Analiz Türü:</label>
            <Select value={selectedWidget} onValueChange={setSelectedWidget}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Bir analiz türü seçin" />
              </SelectTrigger>
              <SelectContent>
                {widgetOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Widget Display */}
          <div className="w-full">
            {widgetOptions.map((option) => {
              if (option.value === selectedWidget) {
                const WidgetComponent = option.component
                return (
                  <WidgetComponent
                    key={`${option.value}-${refreshKey}`}
                    dateRange={dateRange}
                    loading={loading}
                  />
                )
              }
              return null
            })}
          </div>
        </div>
      </div>
    </AnalyticsLayout>
  )
}