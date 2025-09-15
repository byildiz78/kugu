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
  Target,
  Package,
  Gift,
  Users,
  Clock,
  Utensils,
  Percent,
  Calendar,
  Plus,
  Minus,
  Sparkles
} from 'lucide-react'
import { Campaign } from '@prisma/client'
import { toast } from 'sonner'

// Form Components
import { CampaignBasicInfo } from './components/campaign-basic-info'
import { CampaignConditions } from './components/campaign-conditions'
import { CampaignRewards } from './components/campaign-rewards'
import { CampaignTargeting } from './components/campaign-targeting'

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

interface FullscreenCampaignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign?: Campaign | null
  onSubmit: (data: any) => Promise<void>
  isLoading?: boolean
}

export function FullscreenCampaignModal({ 
  open, 
  onOpenChange, 
  campaign, 
  onSubmit, 
  isLoading 
}: FullscreenCampaignModalProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState(1)

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

  useEffect(() => {
    if (open) {
      Promise.all([
        fetchProducts(),
        fetchRewards(),
        fetchSegments()
      ])
    }
  }, [open])

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
      await onSubmit(data)
    } catch (error) {
      console.error('Error submitting campaign:', error)
      toast.error('Kampanya kaydedilirken hata oluştu')
    }
  }

  const steps = [
    {
      id: 1,
      title: 'Temel Bilgiler',
      icon: Target,
      description: 'Kampanya adı, türü ve tarih aralığı'
    },
    {
      id: 2,
      title: 'Koşullar & İndirim',
      icon: Percent,
      description: 'İndirim ayarları ve ürün/kategori seçimi'
    },
    {
      id: 3,
      title: 'Ödüller',
      icon: Gift,
      description: 'Otomatik ödül verme ayarları'
    },
    {
      id: 4,
      title: 'Hedefleme',
      icon: Users,
      description: 'Müşteri segmentleri ve zaman kısıtları'
    }
  ]

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Header */}
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {campaign ? 'Kampanya Düzenle' : 'Yeni Kampanya Oluştur'}
              </h1>
              <p className="text-gray-600">
                Restaurant işletmeniz için özel kampanya tanımlayın
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              İptal
            </Button>
            <Button 
              onClick={handleSubmit(handleFormSubmit)}
              disabled={isLoading}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {campaign ? 'Güncelle' : 'Oluştur'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div 
                  className={`flex items-center space-x-3 px-4 py-2 rounded-lg cursor-pointer transition-all ${
                    currentStep === step.id 
                      ? 'bg-orange-50 text-orange-700 border border-orange-200' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setCurrentStep(step.id)}
                >
                  <step.icon className="h-5 w-5" />
                  <div>
                    <div className="font-medium text-sm">{step.title}</div>
                    <div className="text-xs opacity-75">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-8 h-px bg-gray-200 mx-2"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
            
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <CampaignBasicInfo
                register={register}
                errors={errors}
                setValue={setValue}
                watch={watch}
              />
            )}

            {/* Step 2: Conditions */}
            {currentStep === 2 && (
              <CampaignConditions
                register={register}
                errors={errors}
                setValue={setValue}
                watch={watch}
                products={products}
                categories={categories}
                selectedType={selectedType}
              />
            )}

            {/* Step 3: Rewards */}
            {currentStep === 3 && (
              <CampaignRewards
                register={register}
                setValue={setValue}
                watch={watch}
                rewards={rewards}
                selectedType={selectedType}
              />
            )}

            {/* Step 4: Targeting */}
            {currentStep === 4 && (
              <CampaignTargeting
                register={register}
                setValue={setValue}
                watch={watch}
                segments={segments}
              />
            )}

          </form>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="border-t bg-gray-50 px-6 py-4 sticky bottom-0">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            <Minus className="h-4 w-4 mr-2" />
            Önceki
          </Button>

          <div className="flex space-x-2">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`w-2 h-2 rounded-full ${
                  currentStep === step.id ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <Button
            onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
            disabled={currentStep === 4}
            className="bg-orange-500 hover:bg-orange-600"
          >
            Sonraki
            <Plus className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}