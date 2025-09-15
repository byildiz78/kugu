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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  X,
  Save,
  ArrowRight,
  ArrowLeft,
  FileText,
  Percent,
  Gift,
  Users,
  Clock,
  Utensils,
  Package,
  Target,
  Bell
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

interface CompactCampaignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign?: Campaign | null
  onSubmit: (data: any) => Promise<void>
  isLoading?: boolean
}

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

const DISCOUNT_TYPES = [
  { value: 'PERCENTAGE', label: 'Yüzde (%)', icon: Percent },
  { value: 'FIXED_AMOUNT', label: 'Sabit Tutar (₺)', icon: Package },
  { value: 'FREE_ITEM', label: 'Bedava Ürün', icon: Gift }
]

const DAYS_OF_WEEK = [
  { value: 1, label: 'Pzt' },
  { value: 2, label: 'Sal' },
  { value: 3, label: 'Çar' },
  { value: 4, label: 'Per' },
  { value: 5, label: 'Cum' },
  { value: 6, label: 'Cmt' },
  { value: 7, label: 'Paz' }
]

export function CompactCampaignModal({ 
  open, 
  onOpenChange, 
  campaign, 
  onSubmit, 
  isLoading 
}: CompactCampaignModalProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  
  // Form state
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedRewards, setSelectedRewards] = useState<string[]>([])
  const [selectedSegments, setSelectedSegments] = useState<string[]>([])
  const [validDays, setValidDays] = useState<number[]>([])
  const [hasTimeRestriction, setHasTimeRestriction] = useState(false)
  const [hasDayRestriction, setHasDayRestriction] = useState(false)
  
  // BUY_X_GET_Y specific states
  const [buyProducts, setBuyProducts] = useState<string[]>([])
  const [buyCategories, setBuyCategories] = useState<string[]>([])
  const [getProducts, setGetProducts] = useState<string[]>([])
  const [getCategories, setGetCategories] = useState<string[]>([])
  const [buyGetMode, setBuyGetMode] = useState<'category' | 'product'>('category')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    control
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
  const autoGiveReward = watch('autoGiveReward')
  const sendNotification = watch('sendNotification')

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
        startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().slice(0, 16) : '',
        endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().slice(0, 16) : '',
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
      setSelectedRewards([])
      setSelectedSegments([])
      setValidDays([])
      setHasTimeRestriction(false)
      setHasDayRestriction(false)
      setBuyProducts([])
      setBuyCategories([])
      setGetProducts([])
      setGetCategories([])
      setBuyGetMode('category')
    }
  }, [campaign, reset, setValue])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=100')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
        
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
        rewardIds: selectedRewards.length > 0 ? JSON.stringify(selectedRewards) : null,
        validHours: hasTimeRestriction ? data.validHours : null,
        validDays: hasDayRestriction && validDays.length > 0 ? JSON.stringify(validDays) : null,
        segmentIds: selectedSegments,
        
        // BUY_X_GET_Y için ek alanlar
        ...(selectedType === 'BUY_X_GET_Y' && {
          buyFromCategory: buyGetMode === 'category' && buyCategories.length > 0 ? buyCategories[0] : null,
          getFromCategory: buyGetMode === 'category' && getCategories.length > 0 ? getCategories[0] : null,
          targetProducts: buyGetMode === 'product' && buyProducts.length > 0 ? JSON.stringify(buyProducts) : null,
          getSpecificProduct: buyGetMode === 'product' && getProducts.length > 0 ? getProducts[0] : null,
          freeProducts: buyGetMode === 'product' && getProducts.length > 0 ? JSON.stringify(getProducts) : null,
          freeCategories: buyGetMode === 'category' && getCategories.length > 0 ? JSON.stringify(getCategories) : null
        })
      }

      console.log('Form submit data:', submitData)
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

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Header */}
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {campaign ? 'Kampanya Düzenle' : 'Yeni Kampanya'}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {currentPage}/2
            </span>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              size="sm"
            >
              İptal
            </Button>
            <Button 
              onClick={handleSubmit(handleFormSubmit)}
              disabled={isLoading}
              className="bg-orange-500 hover:bg-orange-600"
              size="sm"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="h-3 w-3 mr-2" />
                  {campaign ? 'Güncelle' : 'Oluştur'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-4">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            
            {/* Page 1: Campaign Details, Conditions, Rewards */}
            {currentPage === 1 && (
              <div className="space-y-4">
                
                {/* Basic Info */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4 text-gray-600" />
                      Temel Bilgiler
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="name" className="text-sm">Kampanya Adı *</Label>
                        <Input
                          id="name"
                          {...register('name')}
                          placeholder="Hafta Sonu İndirim"
                          className="h-8 text-sm"
                        />
                        {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
                      </div>

                      <div className="space-y-1">
                        <Label className="text-sm">Kampanya Türü *</Label>
                        <Select value={watch('type')} onValueChange={(value) => setValue('type', value)}>
                          <SelectTrigger className="h-8 text-sm">
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

                    <div className="space-y-1">
                      <Label htmlFor="description" className="text-sm">Açıklama *</Label>
                      <Textarea
                        id="description"
                        {...register('description')}
                        placeholder="Kampanya açıklaması..."
                        rows={2}
                        className="text-sm resize-none"
                      />
                      {errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="startDate" className="text-sm">Başlangıç *</Label>
                        <Input
                          id="startDate"
                          type="datetime-local"
                          {...register('startDate')}
                          className="h-8 text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="endDate" className="text-sm">Bitiş *</Label>
                        <Input
                          id="endDate"
                          type="datetime-local"
                          {...register('endDate')}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Conditions */}
                {['DISCOUNT', 'PRODUCT_BASED', 'CATEGORY_DISCOUNT'].includes(selectedType) && (
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Percent className="h-4 w-4 text-gray-600" />
                        İndirim Koşulları
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-4 gap-2">
                        {DISCOUNT_TYPES.map((type) => (
                          <div
                            key={type.value}
                            className={`p-2 border rounded cursor-pointer text-center ${
                              watch('discountType') === type.value 
                                ? 'border-orange-500 bg-orange-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setValue('discountType', type.value)}
                          >
                            <type.icon className="h-3 w-3 mx-auto mb-1" />
                            <span className="text-xs">{type.label}</span>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-sm">
                            Miktar ({watch('discountType') === 'PERCENTAGE' ? '%' : '₺'})
                          </Label>
                          <Input
                            type="number"
                            {...register('discountValue', { valueAsNumber: true })}
                            className="h-8 text-sm"
                            placeholder="20"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-sm">Min. Alışveriş (₺)</Label>
                          <Input
                            type="number"
                            {...register('minPurchase', { valueAsNumber: true })}
                            className="h-8 text-sm"
                            placeholder="100"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-sm">Kullanım Limiti</Label>
                          <Input
                            type="number"
                            {...register('maxUsagePerCustomer', { valueAsNumber: true })}
                            className="h-8 text-sm"
                            placeholder="1"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Product/Category Selection */}
                {selectedType === 'PRODUCT_BASED' && (
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Package className="h-4 w-4 text-gray-600" />
                        Ürün Seçimi
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Select onValueChange={(value) => addToSelection(value, selectedProducts, setSelectedProducts)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Ürün ekle" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - {product.price}₺
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {selectedProducts.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {selectedProducts.map((productId) => {
                            const product = products.find(p => p.id === productId)
                            return (
                              <Badge key={productId} variant="secondary" className="text-xs flex items-center gap-1">
                                {product?.name}
                                <X 
                                  className="h-2 w-2 cursor-pointer" 
                                  onClick={() => removeFromSelection(productId, selectedProducts, setSelectedProducts)}
                                />
                              </Badge>
                            )
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Category Selection for CATEGORY_DISCOUNT */}
                {selectedType === 'CATEGORY_DISCOUNT' && (
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Utensils className="h-4 w-4 text-gray-600" />
                        Kategori Seçimi
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-4 gap-2">
                        {categories.map((category) => (
                          <div
                            key={category}
                            className={`p-2 border rounded cursor-pointer text-center ${
                              selectedCategories.includes(category)
                                ? 'border-orange-500 bg-orange-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => {
                              if (selectedCategories.includes(category)) {
                                removeFromSelection(category, selectedCategories, setSelectedCategories)
                              } else {
                                addToSelection(category, selectedCategories, setSelectedCategories)
                              }
                            }}
                          >
                            <Utensils className="h-3 w-3 mx-auto mb-1" />
                            <span className="text-xs">{category}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* BUY_X_GET_Y Settings */}
                {selectedType === 'BUY_X_GET_Y' && (
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Gift className="h-4 w-4 text-gray-600" />
                        X Al Y Bedava Ayarları
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Adet Ayarları */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-sm">Al (Adet)</Label>
                          <Input
                            type="number"
                            {...register('buyQuantity', { valueAsNumber: true })}
                            className="h-8 text-sm"
                            placeholder="5"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm">Bedava (Adet)</Label>
                          <Input
                            type="number"
                            {...register('getQuantity', { valueAsNumber: true })}
                            className="h-8 text-sm"
                            placeholder="1"
                          />
                        </div>
                      </div>

                      {/* Seçim Tipi */}
                      <div className="space-y-2">
                        <Label className="text-sm">Seçim Tipi</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={buyGetMode === 'category' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setBuyGetMode('category')}
                            className="h-8 text-xs"
                          >
                            Kategori Bazlı
                          </Button>
                          <Button
                            type="button"
                            variant={buyGetMode === 'product' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setBuyGetMode('product')}
                            className="h-8 text-xs"
                          >
                            Ürün Bazlı
                          </Button>
                        </div>
                      </div>

                      {/* Satın Alınacak Ürünler/Kategoriler */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Satın Alınacak {buyGetMode === 'category' ? 'Kategoriler' : 'Ürünler'}</Label>
                        
                        {buyGetMode === 'category' ? (
                          <>
                            <div className="grid grid-cols-3 gap-2">
                              {categories.map((category) => (
                                <div
                                  key={category}
                                  className={`p-2 border rounded cursor-pointer text-center ${
                                    buyCategories.includes(category)
                                      ? 'border-blue-500 bg-blue-50'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                  onClick={() => {
                                    if (buyCategories.includes(category)) {
                                      setBuyCategories(buyCategories.filter(c => c !== category))
                                    } else {
                                      setBuyCategories([...buyCategories, category])
                                    }
                                  }}
                                >
                                  <Utensils className="h-3 w-3 mx-auto mb-1" />
                                  <span className="text-xs">{category}</span>
                                </div>
                              ))}
                            </div>
                            {buyCategories.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {buyCategories.map((category) => (
                                  <Badge key={category} variant="secondary" className="text-xs flex items-center gap-1">
                                    <span className="text-blue-600">Al:</span> {category}
                                    <X 
                                      className="h-2 w-2 cursor-pointer" 
                                      onClick={() => setBuyCategories(buyCategories.filter(c => c !== category))}
                                    />
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <Select onValueChange={(value) => addToSelection(value, buyProducts, setBuyProducts)}>
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Satın alınacak ürün seç" />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name} - {product.price}₺
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {buyProducts.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {buyProducts.map((productId) => {
                                  const product = products.find(p => p.id === productId)
                                  return (
                                    <Badge key={productId} variant="secondary" className="text-xs flex items-center gap-1">
                                      <span className="text-blue-600">Al:</span> {product?.name}
                                      <X 
                                        className="h-2 w-2 cursor-pointer" 
                                        onClick={() => removeFromSelection(productId, buyProducts, setBuyProducts)}
                                      />
                                    </Badge>
                                  )
                                })}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Bedava Verilecek Ürünler/Kategoriler */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Bedava Verilecek {buyGetMode === 'category' ? 'Kategoriler' : 'Ürünler'}</Label>
                        
                        {buyGetMode === 'category' ? (
                          <>
                            <div className="grid grid-cols-3 gap-2">
                              {categories.map((category) => (
                                <div
                                  key={category}
                                  className={`p-2 border rounded cursor-pointer text-center ${
                                    getCategories.includes(category)
                                      ? 'border-green-500 bg-green-50'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                  onClick={() => {
                                    if (getCategories.includes(category)) {
                                      setGetCategories(getCategories.filter(c => c !== category))
                                    } else {
                                      setGetCategories([...getCategories, category])
                                    }
                                  }}
                                >
                                  <Gift className="h-3 w-3 mx-auto mb-1" />
                                  <span className="text-xs">{category}</span>
                                </div>
                              ))}
                            </div>
                            {getCategories.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {getCategories.map((category) => (
                                  <Badge key={category} variant="secondary" className="text-xs flex items-center gap-1">
                                    <span className="text-green-600">Bedava:</span> {category}
                                    <X 
                                      className="h-2 w-2 cursor-pointer" 
                                      onClick={() => setGetCategories(getCategories.filter(c => c !== category))}
                                    />
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <Select onValueChange={(value) => addToSelection(value, getProducts, setGetProducts)}>
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Bedava verilecek ürün seç" />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name} - {product.price}₺
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {getProducts.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {getProducts.map((productId) => {
                                  const product = products.find(p => p.id === productId)
                                  return (
                                    <Badge key={productId} variant="secondary" className="text-xs flex items-center gap-1">
                                      <span className="text-green-600">Bedava:</span> {product?.name}
                                      <X 
                                        className="h-2 w-2 cursor-pointer" 
                                        onClick={() => removeFromSelection(productId, getProducts, setGetProducts)}
                                      />
                                    </Badge>
                                  )
                                })}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Rewards */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Gift className="h-4 w-4 text-gray-600" />
                      Ödül Sistemi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">Otomatik Ödül Ver</div>
                        <div className="text-xs text-gray-500">Kampanya kullanımında ödül verilsin</div>
                      </div>
                      <Switch
                        checked={autoGiveReward}
                        onCheckedChange={(checked) => setValue('autoGiveReward', checked)}
                      />
                    </div>

                    {(autoGiveReward || selectedType === 'REWARD_CAMPAIGN') && (
                      <div className="space-y-2">
                        <Select onValueChange={(value) => addToSelection(value, selectedRewards, setSelectedRewards)}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Ödül ekle" />
                          </SelectTrigger>
                          <SelectContent>
                            {rewards.map((reward) => (
                              <SelectItem key={reward.id} value={reward.id}>
                                {reward.name} {reward.pointsCost && `(${reward.pointsCost}p)`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {selectedRewards.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {selectedRewards.map((rewardId) => {
                              const reward = rewards.find(r => r.id === rewardId)
                              return (
                                <Badge key={rewardId} variant="secondary" className="text-xs flex items-center gap-1">
                                  <Gift className="h-2 w-2" />
                                  {reward?.name}
                                  <X 
                                    className="h-2 w-2 cursor-pointer" 
                                    onClick={() => removeFromSelection(rewardId, selectedRewards, setSelectedRewards)}
                                  />
                                </Badge>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Page 2: Targeting */}
            {currentPage === 2 && (
              <div className="space-y-4">
                
                {/* Customer Segments */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Users className="h-4 w-4 text-gray-600" />
                      Müşteri Hedefleme
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-gray-600 mb-2">Bu kampanyayı görecek müşteri grupları (Seçim yapılmaz ise tüm segmentler için geçerli olur)</div>
                    <div className="grid grid-cols-2 gap-2">
                      {segments.map((segment) => (
                        <div
                          key={segment.id}
                          className={`p-2 border rounded cursor-pointer text-sm ${
                            selectedSegments.includes(segment.id)
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => {
                            if (selectedSegments.includes(segment.id)) {
                              setSelectedSegments(selectedSegments.filter(id => id !== segment.id))
                            } else {
                              setSelectedSegments([...selectedSegments, segment.id])
                            }
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded border ${
                              selectedSegments.includes(segment.id)
                                ? 'border-orange-500 bg-orange-500'
                                : 'border-gray-300'
                            }`}>
                              {selectedSegments.includes(segment.id) && (
                                <div className="w-full h-full bg-white rounded scale-50"></div>
                              )}
                            </div>
                            <span>{segment.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Time Restrictions */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Clock className="h-4 w-4 text-gray-600" />
                      Zaman Kısıtları
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">Saat Kısıtı</div>
                        <div className="text-xs text-gray-500">Belirli saatlerde geçerli olsun</div>
                      </div>
                      <Switch
                        checked={hasTimeRestriction}
                        onCheckedChange={setHasTimeRestriction}
                      />
                    </div>

                    {hasTimeRestriction && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-sm">Başlangıç</Label>
                          <Input
                            type="time"
                            className="h-8 text-sm"
                            onChange={(e) => setValue('validHours.start', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm">Bitiş</Label>
                          <Input
                            type="time"
                            className="h-8 text-sm"
                            onChange={(e) => setValue('validHours.end', e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">Gün Kısıtı</div>
                        <div className="text-xs text-gray-500">Belirli günlerde geçerli olsun</div>
                      </div>
                      <Switch
                        checked={hasDayRestriction}
                        onCheckedChange={setHasDayRestriction}
                      />
                    </div>

                    {hasDayRestriction && (
                      <div className="grid grid-cols-7 gap-1">
                        {DAYS_OF_WEEK.map((day) => (
                          <div
                            key={day.value}
                            className={`p-2 border rounded cursor-pointer text-center ${
                              validDays.includes(day.value)
                                ? 'border-orange-500 bg-orange-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => {
                              if (validDays.includes(day.value)) {
                                setValidDays(validDays.filter(d => d !== day.value))
                              } else {
                                setValidDays([...validDays, day.value])
                              }
                            }}
                          >
                            <span className="text-xs">{day.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Notifications */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Bell className="h-4 w-4 text-gray-600" />
                      Bildirim Ayarları
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">Push Bildirimi</div>
                        <div className="text-xs text-gray-500">Kampanya başladığında bildir</div>
                      </div>
                      <Switch
                        checked={sendNotification}
                        onCheckedChange={(checked) => setValue('sendNotification', checked)}
                      />
                    </div>

                    {sendNotification && (
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <Label className="text-sm">Başlık</Label>
                          <Input
                            {...register('notificationTitle')}
                            placeholder="Yeni Kampanya!"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm">Mesaj</Label>
                          <Textarea
                            {...register('notificationMessage')}
                            placeholder="İndirim fırsatını kaçırmayın!"
                            rows={2}
                            className="text-sm resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

          </form>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="border-t bg-gray-50 px-4 py-3 sticky bottom-0">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            size="sm"
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            Önceki
          </Button>

          <div className="flex space-x-1">
            <div className={`w-2 h-2 rounded-full ${currentPage === 1 ? 'bg-orange-500' : 'bg-gray-300'}`} />
            <div className={`w-2 h-2 rounded-full ${currentPage === 2 ? 'bg-orange-500' : 'bg-gray-300'}`} />
          </div>

          <Button
            onClick={() => setCurrentPage(2)}
            disabled={currentPage === 2}
            className="bg-orange-500 hover:bg-orange-600"
            size="sm"
          >
            Sonraki
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}