'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, Calendar, FileText } from 'lucide-react'

const CAMPAIGN_TYPES = [
  { 
    value: 'DISCOUNT', 
    label: 'Genel İndirim', 
    description: 'Toplam tutardan yüzde veya sabit tutar indirim'
  },
  { 
    value: 'PRODUCT_BASED', 
    label: 'Ürün Bazlı İndirim', 
    description: 'Belirli ürünlerde özel indirim'
  },
  { 
    value: 'CATEGORY_DISCOUNT', 
    label: 'Kategori İndirimi', 
    description: 'Belirli kategorilerde toplu indirim'
  },
  { 
    value: 'BUY_X_GET_Y', 
    label: 'X Al Y Bedava', 
    description: 'Belirli adet alımda bedava ürün'
  },
  { 
    value: 'REWARD_CAMPAIGN', 
    label: 'Ödül Kampanyası', 
    description: 'Alışveriş sonrası otomatik ödül verme'
  }
]

interface CampaignBasicInfoProps {
  register: any
  errors: any
  setValue: any
  watch: any
}

export function CampaignBasicInfo({ register, errors, setValue, watch }: CampaignBasicInfoProps) {
  const selectedType = watch('type')

  return (
    <div className="space-y-4">
      {/* Campaign Details */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-gray-600" />
            Kampanya Detayları
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Kampanya Adı *
              </Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Örn: Hafta Sonu İndirim"
                className="h-9"
              />
              {errors.name && (
                <p className="text-xs text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Kampanya Türü *</Label>
              <Select onValueChange={(value) => setValue('type', value)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Tür seçin" />
                </SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium text-sm">{type.label}</div>
                        <div className="text-xs text-gray-500">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Açıklama *
            </Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Kampanya açıklaması..."
              rows={2}
              className="text-sm resize-none"
            />
            {errors.description && (
              <p className="text-xs text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm font-medium">
                Başlangıç *
              </Label>
              <Input
                id="startDate"
                type="datetime-local"
                {...register('startDate')}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-sm font-medium">
                Bitiş *
              </Label>
              <Input
                id="endDate"
                type="datetime-local"
                {...register('endDate')}
                className="h-9 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}