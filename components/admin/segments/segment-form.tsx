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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Target, Sparkles, TrendingUp, Users, Clock, ShoppingCart, DollarSign } from 'lucide-react'
import { Segment } from '@prisma/client'
import { SegmentCriteria, DEFAULT_SEGMENTS } from '@/lib/segment-analyzer'

const segmentSchema = z.object({
  name: z.string().min(2, 'Segment adı en az 2 karakter olmalıdır'),
  description: z.string().optional(),
  rules: z.string().optional(),
  isAutomatic: z.boolean().default(false),
  criteria: z.string().optional()
})

type SegmentFormData = z.infer<typeof segmentSchema>

interface SegmentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  segment?: Segment | null
  onSubmit: (data: SegmentFormData) => Promise<void>
  isLoading?: boolean
}

type ExtendedSegment = Segment

const periodOptions = [
  { value: 'last_30_days', label: 'Son 30 Gün', icon: Clock },
  { value: 'last_90_days', label: 'Son 90 Gün', icon: Clock },
  { value: 'last_180_days', label: 'Son 180 Gün', icon: Clock },
  { value: 'last_year', label: 'Son 1 Yıl', icon: Clock },
  { value: 'all_time', label: 'Tüm Zamanlar', icon: Clock }
]

const templateIcons: Record<string, any> = {
  'VIP Müşteriler': Sparkles,
  'Aktif Müşteriler': TrendingUp,
  'Sadık Müşteriler': Users,
  'Yeni Müşteriler': Users,
  'Risk Altındaki Müşteriler': Clock,
  'Yüksek Harcama Yapanlar': DollarSign,
  'Sık Alışveriş Yapanlar': ShoppingCart
}

export function SegmentForm({ 
  open, 
  onOpenChange, 
  segment, 
  onSubmit, 
  isLoading 
}: SegmentFormProps) {
  const [segmentCriteria, setSegmentCriteria] = useState<SegmentCriteria | null>(null)
  const [isAutomatic, setIsAutomatic] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<SegmentFormData>({
    resolver: zodResolver(segmentSchema),
    defaultValues: {
      name: segment?.name || '',
      description: segment?.description || '',
      rules: segment?.rules || '',
      isAutomatic: (segment as ExtendedSegment)?.isAutomatic || false,
      criteria: segment?.criteria || ''
    }
  })

  useEffect(() => {
    if (segment) {
      const extSegment = segment as ExtendedSegment
      
      reset({
        name: segment.name || '',
        description: segment.description || '',
        rules: segment.rules || '',
        isAutomatic: extSegment.isAutomatic || false,
        criteria: extSegment.criteria || ''
      })
      
      if (extSegment.criteria) {
        try {
          setSegmentCriteria(JSON.parse(extSegment.criteria))
          setIsAutomatic(extSegment.isAutomatic || false)
        } catch (error) {
          console.error('Error parsing criteria:', error)
        }
      }
    } else {
      reset({
        name: '',
        description: '',
        rules: '',
        isAutomatic: false,
        criteria: ''
      })
      setSegmentCriteria(null)
      setIsAutomatic(false)
      setSelectedTemplate('')
    }
  }, [segment, reset])

  const handleFormSubmit = async (data: SegmentFormData) => {
    const submitData = {
      ...data,
      isAutomatic,
      criteria: isAutomatic && segmentCriteria ? JSON.stringify(segmentCriteria) : undefined
    }
    
    await onSubmit(submitData)
    reset()
    setSegmentCriteria(null)
    setIsAutomatic(false)
    setSelectedTemplate('')
  }

  const loadTemplate = (templateName: string) => {
    const template = DEFAULT_SEGMENTS.find(s => s.name === templateName)
    if (template) {
      setValue('name', template.name)
      setValue('description', template.description)
      setSegmentCriteria(template.criteria)
      setIsAutomatic(true)
    }
  }

  const updateCriteria = (updates: Partial<SegmentCriteria>) => {
    const newCriteria = { ...segmentCriteria, ...updates } as SegmentCriteria
    setSegmentCriteria(newCriteria)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-amber-600" />
            {segment ? 'Segment Düzenle' : 'Yeni Segment Oluştur'}
          </DialogTitle>
          <DialogDescription className="text-base">
            {segment 
              ? 'Segment bilgilerini güncelleyin ve müşteri kriterlerini düzenleyin.' 
              : 'Müşterilerinizi otomatik veya manuel olarak gruplandırın.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Temel Bilgiler */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Temel Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Segment Adı *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Örn: VIP Müşteriler"
                    className="h-10"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                {!segment && (
                  <div className="space-y-2">
                    <Label>Hazır Şablon</Label>
                    <Select value={selectedTemplate} onValueChange={(value) => {
                      setSelectedTemplate(value)
                      loadTemplate(value)
                    }}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Şablon seçin (opsiyonel)" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_SEGMENTS.map((template) => {
                          const Icon = templateIcons[template.name] || Target
                          return (
                            <SelectItem key={template.name} value={template.name}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {template.name}
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Segment hakkında açıklama yazın..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Otomatik Segment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Segment Tipi</span>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={isAutomatic}
                    onCheckedChange={(checked) => {
                      setIsAutomatic(checked)
                      if (checked && !segmentCriteria) {
                        // Otomatik segment açıldığında boş criteria oluştur
                        setSegmentCriteria({
                          period: 'last_90_days',
                          averageOrderValue: {},
                          purchaseCount: {},
                          daysSinceFirstPurchase: {},
                          daysSinceLastPurchase: {}
                        })
                      }
                    }}
                  />
                  <Label className="font-normal">Otomatik Segment</Label>
                </div>
              </CardTitle>
              <CardDescription>
                {isAutomatic 
                  ? 'Belirlediğiniz kriterlere göre müşteriler otomatik olarak eklenecek'
                  : 'Müşterileri manuel olarak ekleyeceksiniz'
                }
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Kriterler veya Manuel Kurallar */}
          {isAutomatic ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Otomatik Segment Kriterleri</CardTitle>
                <CardDescription>
                  Müşterilerin bu segmente dahil olması için gereken kriterleri belirleyin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Dönem Seçimi */}
                <div className="space-y-2">
                  <Label>Analiz Dönemi</Label>
                  <Select 
                    value={segmentCriteria?.period || 'last_90_days'} 
                    onValueChange={(value) => updateCriteria({ period: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {periodOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <option.icon className="h-4 w-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Kriterler Grid */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Sol Kolon */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Ortalama Sipariş Değeri</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={segmentCriteria?.averageOrderValue?.min || ''}
                          onChange={(e) => updateCriteria({ 
                            averageOrderValue: { 
                              ...segmentCriteria?.averageOrderValue, 
                              min: e.target.value ? Number(e.target.value) : undefined 
                            }
                          })}
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={segmentCriteria?.averageOrderValue?.max || ''}
                          onChange={(e) => updateCriteria({ 
                            averageOrderValue: { 
                              ...segmentCriteria?.averageOrderValue, 
                              max: e.target.value ? Number(e.target.value) : undefined 
                            }
                          })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Alışveriş Sayısı</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={segmentCriteria?.purchaseCount?.min || ''}
                          onChange={(e) => updateCriteria({ 
                            purchaseCount: { 
                              ...segmentCriteria?.purchaseCount, 
                              min: e.target.value ? Number(e.target.value) : undefined 
                            }
                          })}
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={segmentCriteria?.purchaseCount?.max || ''}
                          onChange={(e) => updateCriteria({ 
                            purchaseCount: { 
                              ...segmentCriteria?.purchaseCount, 
                              max: e.target.value ? Number(e.target.value) : undefined 
                            }
                          })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Son Ziyaret (Gün Önce)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={segmentCriteria?.daysSinceLastPurchase?.min || ''}
                          onChange={(e) => updateCriteria({ 
                            daysSinceLastPurchase: { 
                              ...segmentCriteria?.daysSinceLastPurchase, 
                              min: e.target.value ? Number(e.target.value) : undefined 
                            }
                          })}
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={segmentCriteria?.daysSinceLastPurchase?.max || ''}
                          onChange={(e) => updateCriteria({ 
                            daysSinceLastPurchase: { 
                              ...segmentCriteria?.daysSinceLastPurchase, 
                              max: e.target.value ? Number(e.target.value) : undefined 
                            }
                          })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sağ Kolon */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Ortalama Sepet Tutarı</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={segmentCriteria?.averageOrderValue?.min || ''}
                          onChange={(e) => updateCriteria({ 
                            averageOrderValue: { 
                              ...segmentCriteria?.averageOrderValue, 
                              min: e.target.value ? Number(e.target.value) : undefined 
                            }
                          })}
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={segmentCriteria?.averageOrderValue?.max || ''}
                          onChange={(e) => updateCriteria({ 
                            averageOrderValue: { 
                              ...segmentCriteria?.averageOrderValue, 
                              max: e.target.value ? Number(e.target.value) : undefined 
                            }
                          })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>İlk Ziyaretten Bu Yana (Gün)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={segmentCriteria?.daysSinceFirstPurchase?.min || ''}
                          onChange={(e) => updateCriteria({ 
                            daysSinceFirstPurchase: { 
                              ...segmentCriteria?.daysSinceFirstPurchase, 
                              min: e.target.value ? Number(e.target.value) : undefined 
                            }
                          })}
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={segmentCriteria?.daysSinceFirstPurchase?.max || ''}
                          onChange={(e) => updateCriteria({ 
                            daysSinceFirstPurchase: { 
                              ...segmentCriteria?.daysSinceFirstPurchase, 
                              max: e.target.value ? Number(e.target.value) : undefined 
                            }
                          })}
                        />
                      </div>
                    </div>

                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Manuel Segment Kuralları</CardTitle>
                <CardDescription>
                  Bu segment için açıklayıcı kurallar yazabilirsiniz
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  {...register('rules')}
                  placeholder="Örn: Aylık harcama > 500 TL, Son ziyaret < 30 gün, Doğum günü yaklaşan müşteriler..."
                  rows={4}
                />
              </CardContent>
            </Card>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {segment ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}