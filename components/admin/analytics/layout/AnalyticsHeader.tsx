'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { 
  RefreshCw, 
  Download, 
  Calendar as CalendarIcon,
  Filter,
  Settings
} from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface AnalyticsHeaderProps {
  dateRange: {
    start: Date
    end: Date
  }
  onDateRangeChange: (start: Date, end: Date) => void
  onRefresh: () => void
  onExport: () => void
  loading: boolean
}

export function AnalyticsHeader({
  dateRange,
  onDateRangeChange,
  onRefresh,
  onExport,
  loading
}: AnalyticsHeaderProps) {
  const [showDatePicker, setShowDatePicker] = useState(false)

  const presetRanges = [
    {
      label: 'Son 7 Gün',
      getValue: () => ({
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date()
      })
    },
    {
      label: 'Son 30 Gün',
      getValue: () => ({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      })
    },
    {
      label: 'Son 90 Gün',
      getValue: () => ({
        start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        end: new Date()
      })
    },
    {
      label: 'Bu Yıl',
      getValue: () => ({
        start: new Date(new Date().getFullYear(), 0, 1),
        end: new Date()
      })
    }
  ]

  const handlePresetSelect = (preset: typeof presetRanges[0]) => {
    const range = preset.getValue()
    onDateRangeChange(range.start, range.end)
    setShowDatePicker(false)
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left side - Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Date Range Picker */}
            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full sm:w-auto justify-start text-left font-normal bg-white',
                    !dateRange && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.start ? (
                    dateRange.end ? (
                      <>
                        {format(dateRange.start, 'dd MMM yyyy', { locale: tr })} -{' '}
                        {format(dateRange.end, 'dd MMM yyyy', { locale: tr })}
                      </>
                    ) : (
                      format(dateRange.start, 'dd MMM yyyy', { locale: tr })
                    )
                  ) : (
                    <span>Tarih aralığı seçin</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="flex">
                  {/* Preset buttons */}
                  <div className="border-r border-gray-200 p-3 space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Hızlı Seçim</h4>
                    {presetRanges.map((preset) => (
                      <Button
                        key={preset.label}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handlePresetSelect(preset)}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                  
                  {/* Calendar */}
                  <div className="p-3">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.start}
                      selected={{
                        from: dateRange?.start,
                        to: dateRange?.end,
                      }}
                      onSelect={(range) => {
                        if (range?.from && range?.to) {
                          onDateRangeChange(range.from, range.to)
                          setShowDatePicker(false)
                        }
                      }}
                      numberOfMonths={2}
                      locale={tr}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Quick Filters */}
            <Button variant="outline" className="bg-white">
              <Filter className="mr-2 h-4 w-4" />
              Filtreler
            </Button>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="bg-white"
            >
              <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
              Yenile
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="bg-white"
            >
              <Download className="mr-2 h-4 w-4" />
              Dışa Aktar
            </Button>

            <Button variant="outline" size="sm" className="bg-white">
              <Settings className="mr-2 h-4 w-4" />
              Ayarlar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}