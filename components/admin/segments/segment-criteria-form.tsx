'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SegmentCriteria, DEFAULT_SEGMENTS } from '@/lib/segment-analyzer'
import { Zap, Settings } from 'lucide-react'

interface SegmentCriteriaFormProps {
  criteria: SegmentCriteria | null
  onCriteriaChange: (criteria: SegmentCriteria | null) => void
  isAutomatic: boolean
  onAutomaticChange: (automatic: boolean) => void
}

const periodOptions = [
  { value: 'last_30_days', label: 'Son 30 Gün' },
  { value: 'last_90_days', label: 'Son 90 Gün' },
  { value: 'last_180_days', label: 'Son 180 Gün' },
  { value: 'last_year', label: 'Son 1 Yıl' },
  { value: 'all_time', label: 'Tüm Zamanlar' }
]

export function SegmentCriteriaForm({
  criteria,
  onCriteriaChange,
  isAutomatic,
  onAutomaticChange
}: SegmentCriteriaFormProps) {
  const [localCriteria, setLocalCriteria] = useState<SegmentCriteria>(
    criteria || { period: 'last_90_days' }
  )

  useEffect(() => {
    if (criteria) {
      setLocalCriteria(criteria)
    }
  }, [criteria])

  const updateCriteria = (updates: Partial<SegmentCriteria>) => {
    const newCriteria = { ...localCriteria, ...updates }
    setLocalCriteria(newCriteria)
    onCriteriaChange(newCriteria)
  }

  const loadDefaultSegment = (segmentName: string) => {
    const defaultSegment = DEFAULT_SEGMENTS.find(s => s.name === segmentName)
    if (defaultSegment) {
      setLocalCriteria(defaultSegment.criteria)
      onCriteriaChange(defaultSegment.criteria)
      onAutomaticChange(true)
    }
  }

  return (
    <div className="space-y-6">
      {/* Automatic Segment Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-amber-600" />
            <span>Otomatik Segment</span>
          </CardTitle>
          <CardDescription>
            Otomatik segmentler, belirlenen kriterlere göre müşterileri otomatik olarak gruplar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              checked={isAutomatic}
              onCheckedChange={onAutomaticChange}
            />
            <Label>Otomatik segment kurallarını etkinleştir</Label>
          </div>
        </CardContent>
      </Card>

      {isAutomatic && (
        <>
          {/* Default Segments */}
          <Card>
            <CardHeader>
              <CardTitle>Hazır Segment Şablonları</CardTitle>
              <CardDescription>
                Önceden tanımlanmış segment kriterlerini kullanabilirsiniz
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {DEFAULT_SEGMENTS.map((segment) => (
                  <Button
                    key={segment.name}
                    variant="outline"
                    className="h-auto p-4 text-left justify-start"
                    onClick={() => loadDefaultSegment(segment.name)}
                  >
                    <div>
                      <div className="font-medium">{segment.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {segment.description}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom Criteria */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-blue-600" />
                <span>Özel Kriterler</span>
              </CardTitle>
              <CardDescription>
                Segment için özel kriterler belirleyin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Period Selection */}
              <div className="space-y-2">
                <Label>Analiz Dönemi</Label>
                <Select
                  value={localCriteria.period || 'last_90_days'}
                  onValueChange={(value) => updateCriteria({ period: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {periodOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Average Order Value */}
              <div className="space-y-3">
                <Label>Dönem Başına Ortalama Fiyat (₺)</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Minimum</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={localCriteria.averageOrderValue?.min || ''}
                      onChange={(e) => updateCriteria({
                        averageOrderValue: {
                          ...localCriteria.averageOrderValue,
                          min: e.target.value ? Number(e.target.value) : undefined
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Maksimum</Label>
                    <Input
                      type="number"
                      placeholder="Sınırsız"
                      value={localCriteria.averageOrderValue?.max || ''}
                      onChange={(e) => updateCriteria({
                        averageOrderValue: {
                          ...localCriteria.averageOrderValue,
                          max: e.target.value ? Number(e.target.value) : undefined
                        }
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Purchase Count */}
              <div className="space-y-3">
                <Label>Dönem Başına Satın Alma Sayısı</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Minimum</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={localCriteria.purchaseCount?.min || ''}
                      onChange={(e) => updateCriteria({
                        purchaseCount: {
                          ...localCriteria.purchaseCount,
                          min: e.target.value ? Number(e.target.value) : undefined
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Maksimum</Label>
                    <Input
                      type="number"
                      placeholder="Sınırsız"
                      value={localCriteria.purchaseCount?.max || ''}
                      onChange={(e) => updateCriteria({
                        purchaseCount: {
                          ...localCriteria.purchaseCount,
                          max: e.target.value ? Number(e.target.value) : undefined
                        }
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Days Since First Purchase */}
              <div className="space-y-3">
                <Label>İlk Satın Alma Tarihinden Gün Sayısı</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Minimum</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={localCriteria.daysSinceFirstPurchase?.min || ''}
                      onChange={(e) => updateCriteria({
                        daysSinceFirstPurchase: {
                          ...localCriteria.daysSinceFirstPurchase,
                          min: e.target.value ? Number(e.target.value) : undefined
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Maksimum</Label>
                    <Input
                      type="number"
                      placeholder="Sınırsız"
                      value={localCriteria.daysSinceFirstPurchase?.max || ''}
                      onChange={(e) => updateCriteria({
                        daysSinceFirstPurchase: {
                          ...localCriteria.daysSinceFirstPurchase,
                          max: e.target.value ? Number(e.target.value) : undefined
                        }
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Days Since Last Purchase */}
              <div className="space-y-3">
                <Label>Son Satın Alma Tarihinden Gün Sayısı</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Minimum</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={localCriteria.daysSinceLastPurchase?.min || ''}
                      onChange={(e) => updateCriteria({
                        daysSinceLastPurchase: {
                          ...localCriteria.daysSinceLastPurchase,
                          min: e.target.value ? Number(e.target.value) : undefined
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Maksimum</Label>
                    <Input
                      type="number"
                      placeholder="Sınırsız"
                      value={localCriteria.daysSinceLastPurchase?.max || ''}
                      onChange={(e) => updateCriteria({
                        daysSinceLastPurchase: {
                          ...localCriteria.daysSinceLastPurchase,
                          max: e.target.value ? Number(e.target.value) : undefined
                        }
                      })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}