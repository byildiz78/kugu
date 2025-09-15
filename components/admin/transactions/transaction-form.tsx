'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Trash2, Calculator } from 'lucide-react'
import { CampaignCalculator } from '@/lib/campaign-calculator'

const transactionSchema = z.object({
  customerId: z.string().min(1, 'Müşteri seçilmelidir'),
  paymentMethod: z.string().optional(),
  notes: z.string().optional()
})

type TransactionFormData = z.infer<typeof transactionSchema>

interface TransactionItem {
  productId: string
  productName: string
  category?: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface TransactionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => Promise<void>
  isLoading?: boolean
}

interface Customer {
  id: string
  name: string
  email: string
  points: number
  level: string
}

interface Product {
  id: string
  name: string
  category: string
  price: number
}

export function TransactionForm({ open, onOpenChange, onSubmit, isLoading }: TransactionFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [items, setItems] = useState<TransactionItem[]>([])
  const [calculation, setCalculation] = useState<any>(null)
  const [calculating, setCalculating] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema)
  })

  const selectedCustomerId = watch('customerId')

  useEffect(() => {
    if (open) {
      fetchCustomers()
      fetchProducts()
    }
  }, [open])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers?limit=100')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=100&isActive=true')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const addItem = () => {
    setItems(prev => [...prev, {
      productId: '',
      productName: '',
      category: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0
    }])
  }

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof TransactionItem, value: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        const updated = { ...item, [field]: value }
        
        if (field === 'productId') {
          const product = products.find(p => p.id === value)
          if (product) {
            updated.productName = product.name
            updated.category = product.category
            updated.unitPrice = product.price
            updated.totalPrice = updated.quantity * product.price
          }
        }
        
        if (field === 'quantity' || field === 'unitPrice') {
          updated.totalPrice = updated.quantity * updated.unitPrice
        }
        
        return updated
      }
      return item
    }))
  }

  const calculateTransaction = async () => {
    if (!selectedCustomerId || items.length === 0) return

    try {
      setCalculating(true)
      const result = await CampaignCalculator.calculateTransaction(
        selectedCustomerId,
        items
      )
      setCalculation(result)
    } catch (error) {
      console.error('Error calculating transaction:', error)
    } finally {
      setCalculating(false)
    }
  }

  const handleFormSubmit = async (data: TransactionFormData) => {
    if (!calculation) {
      await calculateTransaction()
      return
    }

    const orderNumber = CampaignCalculator.generateOrderNumber()
    
    const submitData = {
      ...data,
      orderNumber,
      totalAmount: calculation.subtotal,
      discountAmount: calculation.totalDiscount,
      finalAmount: calculation.finalAmount,
      pointsUsed: 0,
      items: items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        category: item.category,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      })),
      appliedCampaigns: calculation.appliedCampaigns.map((campaign: any) => ({
        campaignId: campaign.campaignId,
        discountAmount: campaign.discountAmount,
        freeItems: campaign.freeItems,
        pointsEarned: campaign.pointsEarned
      }))
    }

    await onSubmit(submitData)
    reset()
    setItems([])
    setCalculation(null)
  }

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni Satış İşlemi</DialogTitle>
          <DialogDescription>
            Müşteri seçin, ürünleri ekleyin ve kampanyaları hesaplayın
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Customer Selection */}
          <div className="space-y-2">
            <Label htmlFor="customerId">Müşteri *</Label>
            <Select
              value={selectedCustomerId}
              onValueChange={(value) => setValue('customerId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Müşteri seçin" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} - {customer.points} puan
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.customerId && (
              <p className="text-sm text-red-600">{errors.customerId.message}</p>
            )}
          </div>

          {/* Items */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Ürünler</Label>
              <Button type="button" onClick={addItem} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Ürün Ekle
              </Button>
            </div>

            {items.map((item, index) => (
              <Card key={index}>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-4">
                      <Label>Ürün</Label>
                      <Select
                        value={item.productId}
                        onValueChange={(value) => updateItem(index, 'productId', value)}
                      >
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
                    
                    <div className="col-span-2">
                      <Label>Miktar</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <Label>Birim Fiyat</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <Label>Toplam</Label>
                      <Input
                        value={`${item.totalPrice.toFixed(2)}₺`}
                        disabled
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Calculation */}
          {items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5" />
                  <span>İşlem Özeti</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Ara Toplam:</span>
                    <span>{subtotal.toFixed(2)}₺</span>
                  </div>
                  
                  {calculation && (
                    <>
                      <div className="flex justify-between text-green-600">
                        <span>Toplam İndirim:</span>
                        <span>-{calculation.totalDiscount.toFixed(2)}₺</span>
                      </div>
                      
                      <div className="flex justify-between font-bold text-lg">
                        <span>Ödenecek Tutar:</span>
                        <span>{calculation.finalAmount.toFixed(2)}₺</span>
                      </div>
                      
                      <div className="flex justify-between text-amber-600">
                        <span>Kazanılacak Puan:</span>
                        <span>{calculation.pointsEarned} puan</span>
                      </div>
                      
                      {calculation.appliedCampaigns.length > 0 && (
                        <div className="mt-4">
                          <Label>Uygulanan Kampanyalar:</Label>
                          <div className="space-y-1 mt-2">
                            {calculation.appliedCampaigns.map((campaign: any, index: number) => (
                              <Badge key={index} variant="secondary">
                                {campaign.campaignName} (-{campaign.discountAmount.toFixed(2)}₺)
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  
                  {!calculation && (
                    <Button
                      type="button"
                      onClick={calculateTransaction}
                      disabled={calculating || !selectedCustomerId}
                      className="w-full"
                    >
                      {calculating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Kampanyaları Hesapla
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Ödeme Yöntemi</Label>
            <Select onValueChange={(value) => setValue('paymentMethod', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Ödeme yöntemi seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Nakit</SelectItem>
                <SelectItem value="CARD">Kredi Kartı</SelectItem>
                <SelectItem value="MOBILE">Mobil Ödeme</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notlar</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="İşlem hakkında notlar..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              İptal
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !calculation || items.length === 0}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              İşlemi Tamamla
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}