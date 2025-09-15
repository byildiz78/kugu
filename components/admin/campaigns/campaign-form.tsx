'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Clock, Users, Gift } from 'lucide-react'
import { Campaign } from '@prisma/client'
import { CAMPAIGN_TYPES, DISCOUNT_TYPES } from '@/lib/campaign-manager'

const campaignSchema = z.object({
  name: z.string().min(2, 'Kampanya adı en az 2 karakter olmalıdır'),
  description: z.string().min(10, 'Açıklama en az 10 karakter olmalıdır'),
  type: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  discountType: z.string(),
  discountValue: z.number().min(0),
  minPurchase: z.number().optional(),
  maxUsage: z.number().optional(),
  maxUsagePerCustomer: z.number().min(1).default(1),
  validHours: z.object({
    start: z.string(),
    end: z.string()
  }).optional(),
  validDays: z.array(z.number()).optional(),
  pointsMultiplier: z.number().min(1).default(1),
  sendNotification: z.boolean().default(true),
  notificationTitle: z.string().optional(),
  notificationMessage: z.string().optional(),
  segmentIds: z.array(z.string()).optional()
})

type CampaignFormData = z.infer<typeof campaignSchema>

interface CampaignFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign?: Campaign | null
  onSubmit: (data: any) => Promise<void>
  isLoading?: boolean
}

interface Segment {
  id: string
  name: string
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Pazartesi' },
  { value: 2, label: 'Salı' },
  { value: 3, label: 'Çarşamba' },
  { value: 4, label: 'Perşembe' },
  { value: 5, label: 'Cuma' },
  { value: 6, label: 'Cumartesi' },
  { value: 7, label: 'Pazar' }
]

export function CampaignForm({ open, onOpenChange, campaign, onSubmit, isLoading }: CampaignFormProps) {
  const [segments, setSegments] = useState<Segment[]>([])
  const [selectedSegments, setSelectedSegments] = useState<string[]>([])
  const [validDays, setValidDays] = useState<number[]>([])
  const [hasTimeRestriction, setHasTimeRestriction] = useState(false)
  const [hasDayRestriction, setHasDayRestriction] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: campaign?.name || '',
      description: campaign?.description || '',
      type: campaign?.type || 'DISCOUNT',
      discountType: campaign?.discountType || 'PERCENTAGE',
      discountValue: campaign?.discountValue || 0,
      maxUsagePerCustomer: campaign?.maxUsagePerCustomer || 1,
      pointsMultiplier: campaign?.pointsMultiplier || 1,
      sendNotification: campaign?.sendNotification ?? true
    }
  })

  const selectedType = watch('type')
  const selectedDiscountType = watch('discountType')

  useEffect(() => {
    fetchSegments()
  }, [])

  const fetchSegments = async () => {
    try {
      const response = await fetch('/api/segments?limit=100')
      if (response.ok) {
        const data = await response.json()
        setSegments(data.segments)
      }
    } catch (error) {
      console.error('Error fetching segments:', error)
    }
  }

  const handleFormSubmit = async (data: CampaignFormData) => {
    const submitData = {
      ...data,
      validHours: hasTimeRestriction && data.validHours ? JSON.stringify(data.validHours) : null,
      validDays: hasDayRestriction && validDays.length > 0 ? JSON.stringify(validDays) : null,
      segmentIds: selectedSegments,
      restaurantId: 'default-restaurant-id'
    }
    
    await onSubmit(submitData)
    reset()
    setSelectedSegments([])
    setValidDays([])
    setHasTimeRestriction(false)
    setHasDayRestriction(false)
  }

  const handleSegmentChange = (segmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedSegments(prev => [...prev, segmentId])
    } else {
      setSelectedSegments(prev => prev.filter(id => id !== segmentId))
    }
  }

  const handleDayChange = (day: number, checked: boolean) => {
    if (checked) {
      setValidDays(prev => [...prev, day])
    } else {
      setValidDays(prev => prev.filter(d => d !== day))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {campaign ? 'Kampanya Düzenle' : 'Yeni Kampanya Oluştur'}
          </DialogTitle>
          <DialogDescription>
            {campaign 
              ? 'Kampanya bilgilerini güncelleyin.' 
              : 'Yeni kampanya oluşturun ve müşterilerinize özel teklifler sunun.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Temel Bilgiler</TabsTrigger>
              <TabsTrigger value="conditions">Koşullar</TabsTrigger>
              <TabsTrigger value="targeting">Hedefleme</TabsTrigger>
              <TabsTrigger value="notifications">Bildirimler</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Kampanya Adı *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Örn: Yaz İndirimi"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Kampanya Türü *</Label>
                  <Select
                    value={selectedType}
                    onValueChange={(value) => setValue('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kampanya türü seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {CAMPAIGN_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Açıklama *</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Kampanya hakkında detaylı açıklama yazın..."
                  rows={3}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Başlangıç Tarihi *</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    {...register('startDate')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Bitiş Tarihi *</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    {...register('endDate')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discountType">İndirim Türü *</Label>
                  <Select
                    value={selectedDiscountType}
                    onValueChange={(value) => setValue('discountType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="İndirim türü seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {DISCOUNT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountValue">
                    İndirim Değeri * {selectedDiscountType === 'PERCENTAGE' ? '(%)' : '(₺)'}
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    step="0.01"
                    {...register('discountValue', { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="conditions" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minPurchase">Minimum Sipariş Tutarı (₺)</Label>
                  <Input
                    id="minPurchase"
                    type="number"
                    step="0.01"
                    {...register('minPurchase', { valueAsNumber: true })}
                    placeholder="Sınır yok"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxUsage">Maksimum Kullanım Sayısı</Label>
                  <Input
                    id="maxUsage"
                    type="number"
                    {...register('maxUsage', { valueAsNumber: true })}
                    placeholder="Sınırsız"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUsagePerCustomer">Müşteri Başına Maksimum Kullanım</Label>
                <Input
                  id="maxUsagePerCustomer"
                  type="number"
                  {...register('maxUsagePerCustomer', { valueAsNumber: true })}
                  placeholder="1"
                />
              </div>

              {selectedType === 'LOYALTY_POINTS' && (
                <div className="space-y-2">
                  <Label htmlFor="pointsMultiplier">Puan Çarpanı</Label>
                  <Input
                    id="pointsMultiplier"
                    type="number"
                    step="0.1"
                    {...register('pointsMultiplier', { valueAsNumber: true })}
                    placeholder="1"
                  />
                  <p className="text-xs text-gray-500">
                    Normal puan kazancının kaç katı puan verilecek
                  </p>
                </div>
              )}

              {/* Time Restrictions */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={hasTimeRestriction}
                    onCheckedChange={setHasTimeRestriction}
                  />
                  <Label className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Saat kısıtlaması ekle</span>
                  </Label>
                </div>

                {hasTimeRestriction && (
                  <div className="grid grid-cols-2 gap-4 ml-6">
                    <div className="space-y-2">
                      <Label>Başlangıç Saati</Label>
                      <Input
                        type="time"
                        onChange={(e) => setValue('validHours.start', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bitiş Saati</Label>
                      <Input
                        type="time"
                        onChange={(e) => setValue('validHours.end', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Day Restrictions */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={hasDayRestriction}
                    onCheckedChange={setHasDayRestriction}
                  />
                  <Label>Gün kısıtlaması ekle</Label>
                </div>

                {hasDayRestriction && (
                  <div className="grid grid-cols-4 gap-2 ml-6">
                    {DAYS_OF_WEEK.map((day) => (
                      <div key={day.value} className="flex items-center space-x-2">
                        <Checkbox
                          checked={validDays.includes(day.value)}
                          onCheckedChange={(checked) => 
                            handleDayChange(day.value, checked as boolean)
                          }
                        />
                        <Label className="text-sm">{day.label}</Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="targeting" className="space-y-4 mt-4">
              <div className="space-y-3">
                <Label className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Hedef Segmentler</span>
                </Label>
                <p className="text-sm text-gray-500">
                  Kampanyanın hangi müşteri segmentlerine uygulanacağını seçin. 
                  Hiçbiri seçilmezse tüm müşterilere uygulanır.
                </p>
                
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                  {segments.map((segment) => (
                    <div key={segment.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedSegments.includes(segment.id)}
                        onCheckedChange={(checked) => 
                          handleSegmentChange(segment.id, checked as boolean)
                        }
                      />
                      <Label className="text-sm">{segment.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4 mt-4">
              <div className="flex items-center space-x-2">
                <Switch
                  {...register('sendNotification')}
                />
                <Label className="flex items-center space-x-2">
                  <Gift className="h-4 w-4" />
                  <span>Müşterilere bildirim gönder</span>
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notificationTitle">Bildirim Başlığı</Label>
                <Input
                  id="notificationTitle"
                  {...register('notificationTitle')}
                  placeholder="Örn: Özel İndirim Fırsatı!"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notificationMessage">Bildirim Mesajı</Label>
                <Textarea
                  id="notificationMessage"
                  {...register('notificationMessage')}
                  placeholder="Örn: Size özel %20 indirim kampanyamızdan yararlanın!"
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {campaign ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}