'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Receipt,
  User,
  Package,
  CreditCard,
  Calendar,
  MapPin,
  Star,
  Gift,
  DollarSign,
  Banknote,
  Smartphone,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  ShoppingBag,
  Tag
} from 'lucide-react'

interface TransactionWithDetails {
  id: string
  orderNumber: string
  totalAmount: number
  discountAmount: number
  finalAmount: number
  paymentMethod: string
  status: string
  transactionDate: string
  pointsEarned: number
  pointsUsed: number
  tierMultiplier?: number
  customer: { 
    name: string
    email: string
    phone?: string
    level: string
  }
  tier?: {
    id: string
    name: string
    displayName: string
    color: string
    pointMultiplier: number
  }
  items: Array<{
    id: string
    productName: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  appliedCampaigns: Array<{
    campaign: {
      name: string
      type: string
    }
    discountAmount: number
  }>
  notes?: string
}

interface TransactionDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: TransactionWithDetails | null
}

const statusColors = {
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  REFUNDED: 'bg-gray-100 text-gray-800 border-gray-200'
}

const statusLabels = {
  COMPLETED: 'Tamamlandı',
  PENDING: 'Beklemede',
  CANCELLED: 'İptal',
  REFUNDED: 'İade'
}

const statusIcons = {
  COMPLETED: CheckCircle,
  PENDING: Clock,
  CANCELLED: XCircle,
  REFUNDED: RefreshCw
}

const paymentIcons = {
  CASH: Banknote,
  CARD: CreditCard,
  MOBILE: Smartphone
}

const paymentLabels = {
  CASH: 'Nakit',
  CARD: 'Kart',
  MOBILE: 'Mobil'
}

export function TransactionDetailModal({ open, onOpenChange, transaction }: TransactionDetailModalProps) {
  if (!transaction) return null

  const StatusIcon = statusIcons[transaction.status as keyof typeof statusIcons] || Receipt
  const PaymentIcon = paymentIcons[transaction.paymentMethod as keyof typeof paymentIcons] || CreditCard

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Satış Detayı - {transaction.orderNumber}
          </DialogTitle>
          <DialogDescription>
            {formatDate(transaction.transactionDate)} tarihinde yapılan satış işlemi
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Basic Info */}
          <div className="flex items-center justify-between">
            <Badge className={`text-sm border ${statusColors[transaction.status as keyof typeof statusColors]}`}>
              <StatusIcon className="h-4 w-4 mr-2" />
              {statusLabels[transaction.status as keyof typeof statusLabels]}
            </Badge>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-700">
                {transaction.finalAmount.toFixed(2)}₺
              </div>
              {transaction.discountAmount > 0 && (
                <div className="text-sm text-green-600">
                  -{transaction.discountAmount.toFixed(2)}₺ indirim uygulandı
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Müşteri Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {transaction.customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{transaction.customer.name}</div>
                    <div className="text-sm text-gray-500">{transaction.customer.email}</div>
                    {transaction.customer.phone && (
                      <div className="text-sm text-gray-500">{transaction.customer.phone}</div>
                    )}
                  </div>
                </div>
                
                {transaction.tier && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span 
                      className="px-2 py-1 rounded-full text-sm font-medium"
                      style={{ 
                        backgroundColor: `${transaction.tier.color}20`, 
                        color: transaction.tier.color,
                        border: `1px solid ${transaction.tier.color}40`
                      }}
                    >
                      {transaction.tier.displayName}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({transaction.tierMultiplier || transaction.tier.pointMultiplier}x puan)
                    </span>
                  </div>
                )}

                {transaction.pointsEarned > 0 && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Star className="h-4 w-4" />
                    <span className="font-medium">+{transaction.pointsEarned} puan kazandı</span>
                  </div>
                )}

                {transaction.pointsUsed > 0 && (
                  <div className="flex items-center gap-2 text-red-600">
                    <Star className="h-4 w-4" />
                    <span className="font-medium">-{transaction.pointsUsed} puan kullandı</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Ödeme Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <PaymentIcon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium">
                      {paymentLabels[transaction.paymentMethod as keyof typeof paymentLabels] || transaction.paymentMethod}
                    </div>
                    <div className="text-sm text-gray-500">Ödeme yöntemi</div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ara toplam:</span>
                    <span className="font-medium">{transaction.totalAmount.toFixed(2)}₺</span>
                  </div>
                  {transaction.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>İndirim:</span>
                      <span className="font-medium">-{transaction.discountAmount.toFixed(2)}₺</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Toplam:</span>
                    <span className="text-green-700">{transaction.finalAmount.toFixed(2)}₺</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transaction Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  İşlem Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500">Sipariş Numarası</div>
                    <div className="font-mono font-medium">{transaction.orderNumber}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500">İşlem Tarihi</div>
                    <div className="font-medium">{formatDate(transaction.transactionDate)}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">Durum</div>
                    <Badge className={`text-sm border ${statusColors[transaction.status as keyof typeof statusColors]}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusLabels[transaction.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">Ürün Sayısı</div>
                    <div className="font-medium flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      {transaction.items.length} ürün
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Satılan Ürünler ({transaction.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transaction.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-sm text-gray-500">
                          {item.quantity}x • {item.unitPrice.toFixed(2)}₺/adet
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">
                        {item.totalPrice.toFixed(2)}₺
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Applied Campaigns */}
          {transaction.appliedCampaigns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Uygulanan Kampanyalar ({transaction.appliedCampaigns.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transaction.appliedCampaigns.map((campaign, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Gift className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-green-800">{campaign.campaign.name}</div>
                          <div className="text-sm text-green-600">
                            {campaign.campaign.type} kampanyası
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-700">
                          -{campaign.discountAmount.toFixed(2)}₺
                        </div>
                        <div className="text-xs text-green-600">indirim</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {transaction.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Notlar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {transaction.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}