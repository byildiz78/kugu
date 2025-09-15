'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Gift, Sparkles, Target, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const rewardSchema = z.object({
  name: z.string().min(2, 'Ödül adı en az 2 karakter olmalıdır'),
  description: z.string().min(10, 'Açıklama en az 10 karakter olmalıdır'),
  pointsCost: z.number().min(0).optional(),
  campaignId: z.string().optional(),
  hasPointsCost: z.boolean().default(false)
})

type RewardFormData = z.infer<typeof rewardSchema>

interface Campaign {
  id: string
  name: string
  description: string
}

export default function NewRewardPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(false)
  const [hasPointsCost, setHasPointsCost] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<RewardFormData>({
    resolver: zodResolver(rewardSchema),
    defaultValues: {
      name: '',
      description: '',
      pointsCost: undefined,
      campaignId: '',
      hasPointsCost: false
    }
  })

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns?limit=100')
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    }
  }

  const handleFormSubmit = async (data: RewardFormData) => {
    try {
      setLoading(true)
      
      const submitData = {
        name: data.name,
        description: data.description,
        pointsCost: hasPointsCost ? data.pointsCost || null : null,
        campaignId: data.campaignId || null,
        restaurantId: 'default-restaurant-id' // This will be removed in API
      }

      const response = await fetch('/api/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.log('API Error Response:', errorData)
        const errorMessage = typeof errorData.error === 'string' 
          ? errorData.error 
          : Array.isArray(errorData.error) 
            ? errorData.error.map((e: any) => e.message).join(', ')
            : 'Failed to create reward'
        throw new Error(errorMessage)
      }

      toast.success('Ödül başarıyla oluşturuldu')
      router.push('/admin/rewards')
    } catch (error) {
      console.error('Error creating reward:', error)
      const errorMessage = error instanceof Error ? error.message : 'Ödül oluşturulurken hata oluştu'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Yeni Ödül Oluştur</h1>
          <p className="text-gray-600">Müşterileriniz için yeni bir ödül tanımlayın</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="max-w-2xl space-y-6">
        {/* Temel Bilgiler */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-amber-600" />
              Temel Bilgiler
            </CardTitle>
            <CardDescription>
              Ödülün adı ve açıklaması
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Ödül Adı *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Örn: 50₺ Hediye Kartı"
                className="h-10"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Açıklama *</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Ödül hakkında detaylı açıklama yazın..."
                rows={4}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Puan Maliyeti */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-600" />
                Puan Sistemi
              </div>
              <Switch
                checked={hasPointsCost}
                onCheckedChange={(checked) => {
                  setHasPointsCost(checked)
                  if (!checked) {
                    setValue('pointsCost', undefined)
                  }
                }}
              />
            </CardTitle>
            <CardDescription>
              {hasPointsCost 
                ? 'Bu ödül puan karşılığında alınabilir'
                : 'Bu ödül ücretsiz olarak verilebilir'
              }
            </CardDescription>
          </CardHeader>
          {hasPointsCost && (
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="pointsCost">Puan Maliyeti</Label>
                <Input
                  id="pointsCost"
                  type="number"
                  min="0"
                  {...register('pointsCost', { valueAsNumber: true })}
                  placeholder="Örn: 500"
                  className="h-10"
                />
                {errors.pointsCost && (
                  <p className="text-sm text-red-600">{errors.pointsCost.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  Müşteriler bu ödülü almak için kaç puan harcayacak?
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Kampanya Bağlantısı */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-amber-600" />
              Kampanya Bağlantısı
            </CardTitle>
            <CardDescription>
              Bu ödülü belirli bir kampanyaya bağlayabilirsiniz (isteğe bağlı)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Kampanya</Label>
              <Select onValueChange={(value) => setValue('campaignId', value === 'NONE' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Kampanya seçin (opsiyonel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Kampanyaya bağlama</SelectItem>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Kampanyaya bağlı ödüller, kampanya sona erdiğinde otomatik olarak devre dışı kalır
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
            className="flex-1"
          >
            İptal
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ödül Oluştur
          </Button>
        </div>
      </form>
    </div>
  )
}