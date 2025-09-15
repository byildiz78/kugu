'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Clock, 
  Bell,
  Calendar,
  Target
} from 'lucide-react'

interface Segment {
  id: string
  name: string
}

interface CampaignTargetingProps {
  register: any
  setValue: any
  watch: any
  segments: Segment[]
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Pzt', fullLabel: 'Pazartesi' },
  { value: 2, label: 'Sal', fullLabel: 'Salı' },
  { value: 3, label: 'Çar', fullLabel: 'Çarşamba' },
  { value: 4, label: 'Per', fullLabel: 'Perşembe' },
  { value: 5, label: 'Cum', fullLabel: 'Cuma' },
  { value: 6, label: 'Cmt', fullLabel: 'Cumartesi' },
  { value: 7, label: 'Paz', fullLabel: 'Pazar' }
]

export function CampaignTargeting({ 
  register, 
  setValue, 
  watch, 
  segments 
}: CampaignTargetingProps) {
  const [selectedSegments, setSelectedSegments] = useState<string[]>([])
  const [validDays, setValidDays] = useState<number[]>([])
  const [hasTimeRestriction, setHasTimeRestriction] = useState(false)
  const [hasDayRestriction, setHasDayRestriction] = useState(false)

  const sendNotification = watch('sendNotification')

  const toggleSegment = (segmentId: string) => {
    const newSelected = selectedSegments.includes(segmentId)
      ? selectedSegments.filter(id => id !== segmentId)
      : [...selectedSegments, segmentId]
    
    setSelectedSegments(newSelected)
    setValue('segmentIds', newSelected)
  }

  const toggleDay = (dayValue: number) => {
    const newDays = validDays.includes(dayValue)
      ? validDays.filter(d => d !== dayValue)
      : [...validDays, dayValue]
    
    setValidDays(newDays)
    setValue('validDays', newDays)
  }

  return (
    <div className="space-y-6">
      
      {/* Customer Segments */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-gray-600" />
            Müşteri Segmentleri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Hedef Segmentler</Label>
            <p className="text-sm text-gray-500">
              Kampanyanın hangi müşteri gruplarına gösterileceğini seçin. Hiç seçim yapmazsanız tüm müşterilere gösterilir.
            </p>
            
            {segments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {segments.map((segment) => (
                  <div
                    key={segment.id}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                      selectedSegments.includes(segment.id)
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleSegment(segment.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        selectedSegments.includes(segment.id)
                          ? 'border-orange-500 bg-orange-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedSegments.includes(segment.id) && (
                          <div className="w-2 h-2 bg-white rounded-sm"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{segment.name}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Henüz müşteri segmenti tanımlanmamış</p>
              </div>
            )}

            {selectedSegments.length > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-medium text-blue-800 mb-1">
                  Seçili Segmentler ({selectedSegments.length})
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedSegments.map((segmentId) => {
                    const segment = segments.find(s => s.id === segmentId)
                    return (
                      <Badge key={segmentId} variant="secondary" className="text-xs">
                        {segment?.name}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Time Restrictions */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-gray-600" />
            Zaman Kısıtlamaları
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Time Restriction */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium text-sm">Saat Kısıtlaması</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Kampanyanın sadece belirli saatlerde geçerli olmasını sağlar
                </p>
              </div>
              <Switch
                checked={hasTimeRestriction}
                onCheckedChange={setHasTimeRestriction}
              />
            </div>

            {hasTimeRestriction && (
              <div className="grid grid-cols-2 gap-4 pl-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="text-sm font-medium">
                    Başlangıç Saati
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    className="h-11"
                    onChange={(e) => setValue('validHours.start', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime" className="text-sm font-medium">
                    Bitiş Saati
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    className="h-11"
                    onChange={(e) => setValue('validHours.end', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Day Restriction */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium text-sm">Gün Kısıtlaması</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Kampanyanın sadece belirli günlerde geçerli olmasını sağlar
                </p>
              </div>
              <Switch
                checked={hasDayRestriction}
                onCheckedChange={setHasDayRestriction}
              />
            </div>

            {hasDayRestriction && (
              <div className="pl-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Geçerli Günler</Label>
                  <div className="grid grid-cols-7 gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <div
                        key={day.value}
                        className={`p-3 border-2 rounded-lg cursor-pointer transition-all text-center ${
                          validDays.includes(day.value)
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleDay(day.value)}
                        title={day.fullLabel}
                      >
                        <span className="text-xs font-medium">{day.label}</span>
                      </div>
                    ))}
                  </div>
                  
                  {validDays.length > 0 && (
                    <div className="text-sm text-gray-600">
                      Seçili günler: {validDays.map(d => DAYS_OF_WEEK.find(day => day.value === d)?.fullLabel).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-gray-600" />
            Bildirim Ayarları
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex-1">
              <h3 className="font-medium text-sm">Push Bildirimi Gönder</h3>
              <p className="text-sm text-gray-600 mt-1">
                Kampanya başladığında müşterilere bildirim gönderilsin
              </p>
            </div>
            <Switch
              checked={sendNotification}
              onCheckedChange={(checked) => setValue('sendNotification', checked)}
            />
          </div>

          {sendNotification && (
            <div className="space-y-4 pl-4">
              <div className="space-y-2">
                <Label htmlFor="notificationTitle" className="text-sm font-medium">
                  Bildirim Başlığı
                </Label>
                <Input
                  id="notificationTitle"
                  {...register('notificationTitle')}
                  placeholder="Örn: Yeni Kampanya Başladı!"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notificationMessage" className="text-sm font-medium">
                  Bildirim Mesajı
                </Label>
                <Textarea
                  id="notificationMessage"
                  {...register('notificationMessage')}
                  placeholder="Örn: %20 indirim fırsatını kaçırmayın! Hemen sipariş verin."
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Bell className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800 text-sm">Bildirim Önizleme</span>
                </div>
                <div className="text-yellow-700 text-sm">
                  <div className="font-medium">
                    {watch('notificationTitle') || 'Kampanya Başladı!'}
                  </div>
                  <div className="mt-1">
                    {watch('notificationMessage') || 'Yeni kampanyamızı kaçırmayın!'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}