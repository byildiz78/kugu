'use client'

import { Suspense } from 'react'
import { TopCustomersWidget } from './TopCustomersWidget'
import { CampaignPerformanceWidget } from './CampaignPerformanceWidget'
import { PointAnalyticsWidget } from './PointAnalyticsWidget'
import { CustomerBehaviorWidget } from './CustomerBehaviorWidget'
import { RevenueAnalyticsWidget } from './RevenueAnalyticsWidget'
import { SegmentPerformanceWidget } from './SegmentPerformanceWidget'
import { WidgetSkeleton } from './base/WidgetSkeleton'

interface AnalyticsWidgetGridProps {
  dateRange: {
    start: Date
    end: Date
  }
  refreshKey: number
  loading?: boolean
}

export function AnalyticsWidgetGrid({ dateRange, refreshKey, loading }: AnalyticsWidgetGridProps) {
  const widgets = [
    {
      id: 'top-customers',
      component: TopCustomersWidget,
      span: 'col-span-1 lg:col-span-2',
      priority: 1
    },
    {
      id: 'campaign-performance',
      component: CampaignPerformanceWidget,
      span: 'col-span-1',
      priority: 2
    },
    {
      id: 'point-analytics',
      component: PointAnalyticsWidget,
      span: 'col-span-1',
      priority: 3
    },
    {
      id: 'customer-behavior',
      component: CustomerBehaviorWidget,
      span: 'col-span-1',
      priority: 4
    },
    {
      id: 'revenue-analytics',
      component: RevenueAnalyticsWidget,
      span: 'col-span-1 lg:col-span-2',
      priority: 5
    },
    {
      id: 'segment-performance',
      component: SegmentPerformanceWidget,
      span: 'col-span-1',
      priority: 6
    }
  ]

  return (
    <div className="space-y-6">
      {/* Widget Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {widgets.map(({ id, component: Widget, span }) => (
          <div key={`${id}-${refreshKey}`} className={span}>
            <Suspense fallback={<WidgetSkeleton />}>
              <Widget 
                dateRange={dateRange} 
                loading={loading}
              />
            </Suspense>
          </div>
        ))}
      </div>

    </div>
  )
}