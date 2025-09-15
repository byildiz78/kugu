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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, 
  Clock, 
  Users, 
  Gift, 
  Package, 
  Utensils, 
  Target,
  Plus,
  X
} from 'lucide-react'
import { Campaign } from '@prisma/client'
import { toast } from 'sonner'

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
  
  // Product/Category settings
  targetProducts: z.array(z.string()).optional(),
  targetCategories: z.array(z.string()).optional(),
  freeProducts: z.array(z.string()).optional(),
  freeCategories: z.array(z.string()).optional(),
  
  // Buy-X-Get-Y settings
  buyQuantity: z.number().optional(),
  getQuantity: z.number().optional(),
  buyFromCategory: z.string().optional(),
  getFromCategory: z.string().optional(),
  getSpecificProduct: z.string().optional(),
  
  // Reward integration
  rewardIds: z.array(z.string()).optional(),
  autoGiveReward: z.boolean().default(false),
  
  // Time/Day restrictions
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

interface Product {
  id: string
  name: string
  category: string
  price: number
}

interface Reward {
  id: string
  name: string
  description: string
  pointsCost: number | null
}

interface Segment {
  id: string
  name: string
}

interface EnhancedCampaignFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign?: Campaign | null
  onSubmit: (data: any) => Promise<void>
  isLoading?: boolean
}

const CAMPAIGN_TYPES = [
  { value: 'DISCOUNT', label: 'Genel İndirim', description: 'Toplam tutardan indirim' },
  { value: 'PRODUCT_BASED', label: 'Ürün Bazlı', description: 'Belirli ürünlerde indirim' },
  { value: 'CATEGORY_DISCOUNT', label: 'Kategori İndirimi', description: 'Belirli kategorilerde indirim' },
  { value: 'BUY_X_GET_Y', label: 'X Al Y Bedava', description: 'X adet al, Y adet bedava' },
  { value: 'TIME_BASED', label: 'Zaman Bazlı', description: 'Belirli saatlerde geçerli' },
  { value: 'BIRTHDAY_SPECIAL', label: 'Doğum Günü Özel', description: 'Doğum günü kampanyası' },
  { value: 'COMBO_DEAL', label: 'Kombo Fırsat', description: 'Ürün kombinasyonu indirimi' },
  { value: 'REWARD_CAMPAIGN', label: 'Ödül Kampanyası', description: 'Otomatik ödül verme' },
  { value: 'LOYALTY_POINTS', label: 'Puan Kampanyası', description: 'Ekstra puan kazanma' }
]

const DISCOUNT_TYPES = [
  { value: 'PERCENTAGE', label: 'Yüzde (%)' },
  { value: 'FIXED_AMOUNT', label: 'Sabit Tutar (₺)' },
  { value: 'FREE_ITEM', label: 'Bedava Ürün' },
  { value: 'BUY_ONE_GET_ONE', label: '1 Al 1 Bedava' }
]

const DAYS_OF_WEEK = [
  { value: 1, label: 'Pazartesi' },
  { value: 2, label: 'Salı' },
  { value: 3, label: 'Çarşamba' },
  { value: 4, label: 'Perşembe' },
  { value: 5, label: 'Cuma' },
  { value: 6, label: 'Cumartesi' },
  { value: 7, label: 'Pazar' }
]

export function EnhancedCampaignForm({ 
  open, 
  onOpenChange, 
  campaign, 
  onSubmit, 
  isLoading 
}: EnhancedCampaignFormProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [categories, setCategories] = useState<string[]>([])
  
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedFreeProducts, setSelectedFreeProducts] = useState<string[]>([])
  const [selectedFreeCategories, setSelectedFreeCategories] = useState<string[]>([])
  const [selectedRewards, setSelectedRewards] = useState<string[]>([])
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
      sendNotification: campaign?.sendNotification ?? true,
      autoGiveReward: false
    }
  })

  const selectedType = watch('type')
  const selectedDiscountType = watch('discountType')

  useEffect(() => {
    if (open) {
      Promise.all([
        fetchProducts(),
        fetchRewards(),
        fetchSegments()
      ])
    }
  }, [open])

  // Campaign değiştiğinde form'u güncelle
  useEffect(() => {
    if (campaign) {
      // Temel alanları güncelle
      reset({
        name: campaign.name || '',
        description: campaign.description || '',
        type: campaign.type || 'DISCOUNT',
        startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().split('T')[0] : '',
        endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : '',
        discountType: campaign.discountType || 'PERCENTAGE',
        discountValue: campaign.discountValue || 0,
        minPurchase: campaign.minPurchase || undefined,
        maxUsage: campaign.maxUsage || undefined,
        maxUsagePerCustomer: campaign.maxUsagePerCustomer || 1,
        buyQuantity: campaign.buyQuantity || undefined,
        getQuantity: campaign.getQuantity || undefined,
        buyFromCategory: campaign.buyFromCategory || undefined,
        getFromCategory: campaign.getFromCategory || undefined,
        getSpecificProduct: campaign.getSpecificProduct || undefined,
        pointsMultiplier: campaign.pointsMultiplier || 1,
        sendNotification: campaign.sendNotification ?? true,
        notificationTitle: campaign.notificationTitle || '',
        notificationMessage: campaign.notificationMessage || '',
        autoGiveReward: campaign.autoGiveReward || false
      })

      // JSON alanlarını parse et ve state'leri güncelle
      if (campaign.targetProducts) {
        try {
          setSelectedProducts(JSON.parse(campaign.targetProducts))
        } catch (e) {
          setSelectedProducts([])
        }
      }

      if (campaign.targetCategories) {
        try {
          setSelectedCategories(JSON.parse(campaign.targetCategories))
        } catch (e) {
          setSelectedCategories([])
        }
      }

      if (campaign.freeProducts) {
        try {
          setSelectedFreeProducts(JSON.parse(campaign.freeProducts))
        } catch (e) {
          setSelectedFreeProducts([])
        }
      }

      if (campaign.freeCategories) {
        try {
          setSelectedFreeCategories(JSON.parse(campaign.freeCategories))
        } catch (e) {
          setSelectedFreeCategories([])
        }
      }

      if (campaign.rewardIds) {
        try {
          setSelectedRewards(JSON.parse(campaign.rewardIds))
        } catch (e) {
          setSelectedRewards([])
        }
      }

      // Segments (check if campaign has segments relation)
      if ((campaign as any).segments && Array.isArray((campaign as any).segments)) {
        setSelectedSegments((campaign as any).segments.map((s: any) => s.id || s))
      }

      // Time restrictions
      if (campaign.validHours) {
        try {
          const hours = typeof campaign.validHours === 'string' 
            ? JSON.parse(campaign.validHours) 
            : campaign.validHours
          setHasTimeRestriction(true)
          setValue('validHours', hours)
        } catch (e) {
          setHasTimeRestriction(false)
        }
      }

      // Day restrictions
      if (campaign.validDays) {
        try {
          const days = JSON.parse(campaign.validDays)
          setHasDayRestriction(true)
          setValidDays(days)
        } catch (e) {
          setHasDayRestriction(false)
          setValidDays([])
        }
      }
    } else {
      // Yeni kampanya için sıfırla
      reset()
      setSelectedProducts([])
      setSelectedCategories([])
      setSelectedFreeProducts([])
      setSelectedFreeCategories([])
      setSelectedRewards([])
      setSelectedSegments([])
      setValidDays([])
      setHasTimeRestriction(false)
      setHasDayRestriction(false)
    }
  }, [campaign, reset, setValue])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=100')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
        
        // Extract unique categories
        const uniqueCategories = Array.from(new Set(data.products?.map((p: Product) => p.category).filter(Boolean) || [])) as string[]
        setCategories(uniqueCategories)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchRewards = async () => {
    try {
      const response = await fetch('/api/rewards?limit=100')
      if (response.ok) {
        const data = await response.json()
        setRewards(data.rewards || [])
      }
    } catch (error) {
      console.error('Error fetching rewards:', error)
    }
  }

  const fetchSegments = async () => {
    try {
      const response = await fetch('/api/segments?limit=100')
      if (response.ok) {
        const data = await response.json()
        setSegments(data.segments || [])
      }
    } catch (error) {
      console.error('Error fetching segments:', error)
    }
  }

  const handleFormSubmit = async (data: CampaignFormData) => {
    try {
      const submitData = {
        ...data,
        targetProducts: selectedProducts.length > 0 ? JSON.stringify(selectedProducts) : null,
        targetCategories: selectedCategories.length > 0 ? JSON.stringify(selectedCategories) : null,
        freeProducts: selectedFreeProducts.length > 0 ? JSON.stringify(selectedFreeProducts) : null,
        freeCategories: selectedFreeCategories.length > 0 ? JSON.stringify(selectedFreeCategories) : null,
        rewardIds: selectedRewards.length > 0 ? JSON.stringify(selectedRewards) : null,
        validHours: hasTimeRestriction ? data.validHours : null,
        validDays: hasDayRestriction && validDays.length > 0 ? JSON.stringify(validDays) : null,
        segmentIds: selectedSegments
      }

      await onSubmit(submitData)
    } catch (error) {
      console.error('Error submitting campaign:', error)
      toast.error('Kampanya kaydedilirken hata oluştu')
    }
  }

  const addToSelection = (item: string, list: string[], setList: (list: string[]) => void) => {
    if (!list.includes(item)) {
      setList([...list, item])
    }
  }

  const removeFromSelection = (item: string, list: string[], setList: (list: string[]) => void) => {
    setList(list.filter(i => i !== item))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {campaign ? 'Kampanya Düzenle' : 'Yeni Kampanya Oluştur'}
          </DialogTitle>
          <DialogDescription>
            Restaurant işletmeniz için kampanya tanımlayın
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Temel Bilgiler</TabsTrigger>
              <TabsTrigger value="conditions">Koşullar</TabsTrigger>
              <TabsTrigger value="rewards">Ödüller</TabsTrigger>
              <TabsTrigger value="targeting">Hedefleme</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Kampanya Detayları
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Kampanya Adı *</Label>
                      <Input
                        id="name"
                        {...register('name')}
                        placeholder="Örn: Hafta Sonu %20 İndirim"
                      />
                      {errors.name && (
                        <p className="text-sm text-red-600">{errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Kampanya Türü *</Label>
                      <Select value={watch('type')} onValueChange={(value) => setValue('type', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Kampanya türü seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {CAMPAIGN_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-xs text-gray-500">{type.description}</div>
                              </div>
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
                      placeholder="Kampanya hakkında detaylı açıklama"
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* Conditions Tab */}
            <TabsContent value="conditions" className="space-y-4">
              {/* Discount Settings */}
              {['DISCOUNT', 'PRODUCT_BASED', 'CATEGORY_DISCOUNT'].includes(selectedType) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      İndirim Ayarları
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>İndirim Türü</Label>
                        <Select onValueChange={(value) => setValue('discountType', value)}>
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
                          İndirim Miktarı ({selectedDiscountType === 'PERCENTAGE' ? '%' : '₺'})
                        </Label>
                        <Input
                          id="discountValue"
                          type="number"
                          min="0"
                          step="0.01"
                          {...register('discountValue', { valueAsNumber: true })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minPurchase">Minimum Alışveriş (₺)</Label>
                        <Input
                          id="minPurchase"
                          type="number"
                          min="0"
                          step="0.01"
                          {...register('minPurchase', { valueAsNumber: true })}
                          placeholder="Opsiyonel"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxUsagePerCustomer">Müşteri Başına Kullanım</Label>
                        <Input
                          id="maxUsagePerCustomer"
                          type="number"
                          min="1"
                          {...register('maxUsagePerCustomer', { valueAsNumber: true })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Product/Category Selection */}
              {['PRODUCT_BASED', 'CATEGORY_DISCOUNT', 'BUY_X_GET_Y'].includes(selectedType) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Utensils className="h-5 w-5" />
                      Ürün/Kategori Seçimi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedType === 'PRODUCT_BASED' && (
                      <div className="space-y-3">
                        <Label>Hedef Ürünler</Label>
                        <div className="flex gap-2 mb-2">
                          <Select onValueChange={(value) => addToSelection(value, selectedProducts, setSelectedProducts)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Ürün seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} - {product.price}₺
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedProducts.map((productId) => {
                            const product = products.find(p => p.id === productId)
                            return (
                              <Badge key={productId} variant="secondary" className="flex items-center gap-1">
                                {product?.name}
                                <X 
                                  className="h-3 w-3 cursor-pointer" 
                                  onClick={() => removeFromSelection(productId, selectedProducts, setSelectedProducts)}
                                />
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {selectedType === 'CATEGORY_DISCOUNT' && (
                      <div className="space-y-3">
                        <Label>Hedef Kategoriler</Label>
                        <div className="flex gap-2 mb-2">
                          <Select onValueChange={(value) => addToSelection(value, selectedCategories, setSelectedCategories)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Kategori seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedCategories.map((category) => (
                            <Badge key={category} variant="secondary" className="flex items-center gap-1">
                              {category}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => removeFromSelection(category, selectedCategories, setSelectedCategories)}
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedType === 'BUY_X_GET_Y' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="buyQuantity">Al (Adet)</Label>
                            <Input
                              id="buyQuantity"
                              type="number"
                              min="1"
                              {...register('buyQuantity', { valueAsNumber: true })}
                              placeholder="Örn: 3"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="getQuantity">Bedava Al (Adet)</Label>
                            <Input
                              id="getQuantity"
                              type="number"
                              min="1"
                              {...register('getQuantity', { valueAsNumber: true })}
                              placeholder="Örn: 1"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Alış Kategorisi</Label>
                            <Select onValueChange={(value) => setValue('buyFromCategory', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Kategori seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Bedava Kategori</Label>
                            <Select onValueChange={(value) => setValue('getFromCategory', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Kategori seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Rewards Tab */}
            <TabsContent value="rewards" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Otomatik Ödül Verme
                  </CardTitle>
                  <CardDescription>
                    Bu kampanya kullanıldığında müşterilere otomatik olarak ödül verin
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoGiveReward"
                      onCheckedChange={(checked) => setValue('autoGiveReward', checked)}
                    />
                    <Label htmlFor="autoGiveReward">Otomatik ödül ver</Label>
                  </div>

                  <div className="space-y-3">
                    <Label>Verilecek Ödüller</Label>
                    <div className="flex gap-2 mb-2">
                      <Select onValueChange={(value) => addToSelection(value, selectedRewards, setSelectedRewards)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Ödül seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {rewards.map((reward) => (
                            <SelectItem key={reward.id} value={reward.id}>
                              <div>
                                <div className="font-medium">{reward.name}</div>
                                <div className="text-xs text-gray-500">
                                  {reward.pointsCost ? `${reward.pointsCost} puan` : 'Ücretsiz'}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedRewards.map((rewardId) => {
                        const reward = rewards.find(r => r.id === rewardId)
                        return (
                          <Badge key={rewardId} variant="secondary" className="flex items-center gap-1">
                            <Gift className="h-3 w-3" />
                            {reward?.name}
                            <X 
                              className="h-3 w-3 cursor-pointer" 
                              onClick={() => removeFromSelection(rewardId, selectedRewards, setSelectedRewards)}
                            />
                          </Badge>
                        )
                      })}
                    </div>
                  </div>

                  {selectedType === 'LOYALTY_POINTS' && (
                    <div className="space-y-2">
                      <Label htmlFor="pointsMultiplier">Puan Çarpanı</Label>
                      <Input
                        id="pointsMultiplier"
                        type="number"
                        min="1"
                        step="0.1"
                        {...register('pointsMultiplier', { valueAsNumber: true })}
                        placeholder="Örn: 2 (2 katı puan)"
                      />
                      <p className="text-xs text-gray-500">
                        Normal puan kazancının kaç katı puan verilecek
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Targeting Tab */}
            <TabsContent value="targeting" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Müşteri Segmentleri
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Label>Hedef Segmentler</Label>
                  <div className="space-y-2">
                    {segments.map((segment) => (
                      <div key={segment.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={segment.id}
                          checked={selectedSegments.includes(segment.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSegments([...selectedSegments, segment.id])
                            } else {
                              setSelectedSegments(selectedSegments.filter(id => id !== segment.id))
                            }
                          }}
                        />
                        <Label htmlFor={segment.id}>{segment.name}</Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Zaman Kısıtlamaları
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hasTimeRestriction"
                      checked={hasTimeRestriction}
                      onCheckedChange={setHasTimeRestriction}
                    />
                    <Label htmlFor="hasTimeRestriction">Saat kısıtlaması ekle</Label>
                  </div>

                  {hasTimeRestriction && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startTime">Başlangıç Saati</Label>
                        <Input
                          id="startTime"
                          type="time"
                          onChange={(e) => setValue('validHours.start', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endTime">Bitiş Saati</Label>
                        <Input
                          id="endTime"
                          type="time"
                          onChange={(e) => setValue('validHours.end', e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hasDayRestriction"
                      checked={hasDayRestriction}
                      onCheckedChange={setHasDayRestriction}
                    />
                    <Label htmlFor="hasDayRestriction">Gün kısıtlaması ekle</Label>
                  </div>

                  {hasDayRestriction && (
                    <div className="space-y-2">
                      <Label>Geçerli Günler</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {DAYS_OF_WEEK.map((day) => (
                          <div key={day.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`day-${day.value}`}
                              checked={validDays.includes(day.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setValidDays([...validDays, day.value])
                                } else {
                                  setValidDays(validDays.filter(d => d !== day.value))
                                }
                              }}
                            />
                            <Label htmlFor={`day-${day.value}`} className="text-sm">
                              {day.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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