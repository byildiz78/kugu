'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Package, 
  DollarSign, 
  Tag, 
  FileText, 
  Utensils,
  Coffee,
  Cookie,
  Wine,
  Pizza,
  Sandwich,
  Salad,
  CheckCircle,
  XCircle,
  Key
} from 'lucide-react'
import { Product } from '@prisma/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

interface ProductWithDetails extends Product {
  restaurant?: { 
    name: string 
  }
}

interface ProductFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => Promise<void>
  product?: ProductWithDetails | null
  isLoading: boolean
}

const productSchema = z.object({
  name: z.string().min(2, 'Ürün adı en az 2 karakter olmalıdır'),
  description: z.string().optional(),
  category: z.string().min(1, 'Kategori seçimi zorunludur'),
  price: z.number().min(0.01, 'Fiyat 0\'dan büyük olmalıdır'),
  isActive: z.boolean().default(true)
})

type ProductFormData = z.infer<typeof productSchema>

const categoryOptions = [
  { value: 'Ana Yemek', label: 'Ana Yemek', icon: Utensils },
  { value: 'İçecek', label: 'İçecek', icon: Coffee },
  { value: 'Tatlı', label: 'Tatlı', icon: Cookie },
  { value: 'Alkol', label: 'Alkol', icon: Wine },
  { value: 'Pizza', label: 'Pizza', icon: Pizza },
  { value: 'Sandviç', label: 'Sandviç', icon: Sandwich },
  { value: 'Salata', label: 'Salata', icon: Salad }
]

export function ProductForm({ open, onOpenChange, onSubmit, product, isLoading }: ProductFormProps) {
  const [priceInput, setPriceInput] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      price: 0,
      isActive: true
    }
  })

  const watchedName = watch('name')
  const watchedCategory = watch('category')
  const watchedIsActive = watch('isActive')

  useEffect(() => {
    if (open) {
      if (product) {
        // Edit mode - populate form with product data
        reset({
          name: product.name,
          description: product.description || '',
          category: product.category,
          price: product.price,
          isActive: product.isActive
        })
        setPriceInput(product.price.toString())
      } else {
        // Create mode - reset form
        reset({
          name: '',
          description: '',
          category: '',
          price: 0,
          isActive: true
        })
        setPriceInput('')
      }
    }
  }, [open, product, reset])

  const handleFormSubmit = async (data: ProductFormData) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const handlePriceChange = (value: string) => {
    setPriceInput(value)
    const numValue = parseFloat(value)
    if (!isNaN(numValue)) {
      setValue('price', numValue)
    }
  }

  const getCategoryIcon = (category: string) => {
    const categoryOption = categoryOptions.find(opt => opt.value === category)
    if (categoryOption) {
      const Icon = categoryOption.icon
      return <Icon className="h-4 w-4" />
    }
    return <Package className="h-4 w-4" />
  }

  const formatPricePreview = (price: number) => {
    return price.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {product ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
              </DialogTitle>
              <DialogDescription>
                {product ? 'Ürün bilgilerini güncelleyin' : 'Menüye yeni ürün ekleyin'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Product Preview */}
          <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                {getCategoryIcon(watchedCategory)}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {watchedName || 'Ürün Adı'}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{watchedCategory || 'Kategori'}</span>
                  <span>•</span>
                  <span className="font-medium text-green-600">
                    {priceInput ? `${formatPricePreview(parseFloat(priceInput) || 0)}₺` : '0,00₺'}
                  </span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    {watchedIsActive ? (
                      <>
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span className="text-green-600">Aktif</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 text-red-600" />
                        <span className="text-red-600">Pasif</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Ürün Adı
                </Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Örn: Margherita Pizza"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Kategori
                </Label>
                <Select
                  value={watchedCategory}
                  onValueChange={(value) => setValue('category', value)}
                >
                  <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Kategori seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-red-500">{errors.category.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Fiyat (₺)
                </Label>
                <div className="relative">
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={priceInput}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    placeholder="0.00"
                    className={`pr-8 ${errors.price ? 'border-red-500' : ''}`}
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                    ₺
                  </span>
                </div>
                {errors.price && (
                  <p className="text-sm text-red-500">{errors.price.message}</p>
                )}
                {priceInput && (
                  <p className="text-xs text-gray-500">
                    Önizleme: {formatPricePreview(parseFloat(priceInput) || 0)} TL
                  </p>
                )}
              </div>
            </div>

            {/* Description and Status */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Açıklama (İsteğe Bağlı)
                </Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Ürün hakkında detaylı bilgi..."
                  className="resize-none h-32"
                />
                <p className="text-xs text-gray-500">
                  Ürününüz hakkında müşterilere yardımcı olacak bilgiler ekleyin
                </p>
              </div>

              {/* MenuItemKey Display (Read-only) */}
              {product?.menuItemKey && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    POS Ürün Anahtarı
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-gray-500" />
                      <code className="text-sm font-mono text-gray-700 bg-white px-2 py-1 rounded border">
                        {product.menuItemKey}
                      </code>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      POS sistemi ile entegrasyon için kullanılan benzersiz anahtar
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Ürün Durumu
                </Label>
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <Switch
                    checked={watchedIsActive}
                    onCheckedChange={(checked) => setValue('isActive', checked)}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {watchedIsActive ? 'Aktif' : 'Pasif'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {watchedIsActive 
                        ? 'Ürün menüde görünür ve satışa sunulur' 
                        : 'Ürün menüde görünmez ve satışa sunulmaz'}
                    </div>
                  </div>
                  {watchedIsActive ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
              </div>

              {/* Category Information */}
              {watchedCategory && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {getCategoryIcon(watchedCategory)}
                    <span className="font-medium text-sm text-blue-900">
                      {watchedCategory} Kategorisi
                    </span>
                  </div>
                  <p className="text-xs text-blue-700">
                    Bu ürün menüde {watchedCategory} bölümünde görünecektir.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {product ? 'Güncelleniyor...' : 'Ekleniyor...'}
                </div>
              ) : (
                product ? 'Ürünü Güncelle' : 'Ürün Ekle'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}