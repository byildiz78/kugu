'use client'

import { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  MoreHorizontal, 
  RefreshCw, 
  Download, 
  Maximize2,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface BaseWidgetProps {
  title: string
  description?: string
  children: ReactNode
  loading?: boolean
  error?: string
  trend?: {
    value: number
    isPositive: boolean
    label?: string
  }
  actions?: {
    onRefresh?: () => void
    onExport?: () => void
    onExpand?: () => void
  }
  className?: string
  headerIcon?: ReactNode
}

export function BaseWidget({
  title,
  description,
  children,
  loading = false,
  error,
  trend,
  actions,
  className,
  headerIcon
}: BaseWidgetProps) {
  return (
    <Card className={cn('h-full flex flex-col relative overflow-hidden', className)}>
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              {headerIcon}
              <CardTitle className="text-base font-semibold text-gray-900">
                {title}
              </CardTitle>
              {trend && (
                <div className="flex items-center gap-1">
                  {trend.isPositive ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span 
                    className={cn(
                      'text-xs font-medium',
                      trend.isPositive ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {trend.isPositive ? '+' : ''}{trend.value}%
                  </span>
                </div>
              )}
            </div>
            {description && (
              <CardDescription className="text-sm">
                {description}
              </CardDescription>
            )}
          </div>

          {/* Actions Dropdown */}
          {(actions?.onRefresh || actions?.onExport || actions?.onExpand) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {actions.onRefresh && (
                  <DropdownMenuItem onClick={actions.onRefresh}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Yenile
                  </DropdownMenuItem>
                )}
                {actions.onExport && (
                  <DropdownMenuItem onClick={actions.onExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Dışa Aktar
                  </DropdownMenuItem>
                )}
                {actions.onExpand && (
                  <DropdownMenuItem onClick={actions.onExpand}>
                    <Maximize2 className="mr-2 h-4 w-4" />
                    Genişlet
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="flex-1 pt-0">
        {error ? (
          <div className="flex items-center justify-center h-32 text-red-500">
            <div className="text-center">
              <div className="text-sm font-medium">Hata Oluştu</div>
              <div className="text-xs text-red-400 mt-1">{error}</div>
            </div>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}