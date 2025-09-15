'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Percent, 
  Package, 
  Utensils, 
  X, 
  Plus,
  ShoppingCart,
  Gift
} from 'lucide-react'

const DISCOUNT_TYPES = [
  { value: 'PERCENTAGE', label: 'Yüzde (%)', icon: Percent },
  { value: 'FIXED_AMOUNT', label: 'Sabit Tutar (₺)', icon: ShoppingCart },
  { value: 'FREE_ITEM', label: 'Bedava Ürün', icon: Gift },
  { value: 'BUY_ONE_GET_ONE', label: '1 Al 1 Bedava', icon: Package }
]

interface Product {
  id: string
  name: string
  category: string
  price: number
}

interface CampaignConditionsProps {
  register: any
  errors: any
  setValue: any
  watch: any
  products: Product[]
  categories: string[]
  selectedType: string
}

export function CampaignConditions({ 
  register, 
  errors, 
  setValue, 
  watch, 
  products, 
  categories,
  selectedType 
}: CampaignConditionsProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedFreeProducts, setSelectedFreeProducts] = useState<string[]>([])

  const selectedDiscountType = watch('discountType')
  const buyQuantity = watch('buyQuantity')
  const getQuantity = watch('getQuantity')

  const addToSelection = (item: string, list: string[], setList: (list: string[]) => void) => {
    if (!list.includes(item)) {
      setList([...list, item])
    }
  }

  const removeFromSelection = (item: string, list: string[], setList: (list: string[]) => void) => {
    setList(list.filter(i => i !== item))
  }

  const needsDiscountSettings = ['DISCOUNT', 'PRODUCT_BASED', 'CATEGORY_DISCOUNT', 'COMBO_DEAL'].includes(selectedType)
  const needsProductSelection = ['PRODUCT_BASED'].includes(selectedType)
  const needsCategorySelection = ['CATEGORY_DISCOUNT', 'BUY_X_GET_Y'].includes(selectedType)
  const needsBuyXGetY = selectedType === 'BUY_X_GET_Y'

  return (
    <div className="space-y-6">
      
      {/* Discount Settings */}
      {needsDiscountSettings && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Percent className="h-5 w-5 text-gray-600" />
              İndirim Ayarları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Discount Type Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">İndirim Türü</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {DISCOUNT_TYPES.map((type) => (
                  <div
                    key={type.value}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                      selectedDiscountType === type.value 
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('discountType', type.value)}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <type.icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{type.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Discount Value & Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountValue" className="text-sm font-medium">
                  İndirim Miktarı ({selectedDiscountType === 'PERCENTAGE' ? '%' : '₺'}) *
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('discountValue', { valueAsNumber: true })}
                  placeholder={selectedDiscountType === 'PERCENTAGE' ? '20' : '50'}
                  className="h-11"
                />
                {errors.discountValue && (
                  <p className="text-sm text-red-600">{errors.discountValue.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="minPurchase" className="text-sm font-medium">
                  Minimum Alışveriş (₺)
                </Label>
                <Input
                  id="minPurchase"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('minPurchase', { valueAsNumber: true })}
                  placeholder="100"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUsagePerCustomer" className="text-sm font-medium">
                  Müşteri Başına Kullanım
                </Label>
                <Input
                  id="maxUsagePerCustomer"
                  type="number"
                  min="1"
                  {...register('maxUsagePerCustomer', { valueAsNumber: true })}
                  placeholder="1"
                  className="h-11"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Selection */}
      {needsProductSelection && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-gray-600" />
              Ürün Seçimi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Hedef Ürünler</Label>
              <Select onValueChange={(value) => addToSelection(value, selectedProducts, setSelectedProducts)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="İndirim uygulanacak ürünleri seçin" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex justify-between items-center w-full">
                        <span>{product.name}</span>
                        <span className="text-sm text-gray-500 ml-2">{product.price}₺</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedProducts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedProducts.map((productId) => {
                    const product = products.find(p => p.id === productId)
                    return (
                      <Badge key={productId} variant="secondary" className="flex items-center gap-1">
                        {product?.name}
                        <X 
                          className="h-3 w-3 cursor-pointer hover:bg-gray-300 rounded" 
                          onClick={() => removeFromSelection(productId, selectedProducts, setSelectedProducts)}
                        />
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Selection */}
      {needsCategorySelection && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Utensils className="h-5 w-5 text-gray-600" />
              Kategori Seçimi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                {selectedType === 'BUY_X_GET_Y' ? 'Alış Kategorisi' : 'Hedef Kategoriler'}
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {categories.map((category) => (
                  <div
                    key={category}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                      selectedCategories.includes(category)
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      if (selectedType === 'BUY_X_GET_Y') {
                        setValue('buyFromCategory', category)
                        setSelectedCategories([category])
                      } else {
                        if (selectedCategories.includes(category)) {
                          removeFromSelection(category, selectedCategories, setSelectedCategories)
                        } else {
                          addToSelection(category, selectedCategories, setSelectedCategories)
                        }
                      }
                    }}
                  >
                    <div className="text-center">
                      <Utensils className="h-5 w-5 mx-auto mb-1" />
                      <span className="text-sm font-medium">{category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Buy X Get Y Settings */}
      {needsBuyXGetY && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gift className="h-5 w-5 text-gray-600" />
              Al-Bedava Al Ayarları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="buyQuantity" className="text-sm font-medium">
                  Al (Adet) *
                </Label>
                <Input
                  id="buyQuantity"
                  type="number"
                  min="1"
                  {...register('buyQuantity', { valueAsNumber: true })}
                  placeholder="3"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="getQuantity" className="text-sm font-medium">
                  Bedava Al (Adet) *
                </Label>
                <Input
                  id="getQuantity"
                  type="number"
                  min="1"
                  {...register('getQuantity', { valueAsNumber: true })}
                  placeholder="1"
                  className="h-11"
                />
              </div>
            </div>

            {buyQuantity && getQuantity && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 font-medium text-sm">
                  Kampanya: {buyQuantity} adet {selectedCategories[0] || 'ürün'} al, {getQuantity} adet bedava al
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-sm font-medium">Bedava Verilecek Kategori</Label>
              <Select onValueChange={(value) => setValue('getFromCategory', value)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Bedava verilecek kategoriyi seçin" />
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
          </CardContent>
        </Card>
      )}

      {/* Campaign Preview */}
      {(needsDiscountSettings || needsBuyXGetY) && (
        <Card className="shadow-sm border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 text-lg">Kampanya Önizleme</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-green-700">
              {selectedType === 'BUY_X_GET_Y' && buyQuantity && getQuantity ? (
                <p className="font-medium">
                  "{buyQuantity} adet {selectedCategories[0] || 'ürün'} alana {getQuantity} adet bedava!"
                </p>
              ) : selectedDiscountType === 'PERCENTAGE' ? (
                <p className="font-medium">
                  "%{watch('discountValue') || 0} indirim kampanyası"
                  {watch('minPurchase') && ` (${watch('minPurchase')}₺ ve üzeri alışverişlerde)`}
                </p>
              ) : (
                <p className="font-medium">
                  "{watch('discountValue') || 0}₺ indirim kampanyası"
                  {watch('minPurchase') && ` (${watch('minPurchase')}₺ ve üzeri alışverişlerde)`}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}