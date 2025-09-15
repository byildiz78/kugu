'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PointHistory } from '@/components/admin/customers/point-history'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Star,
  TrendingUp,
  ShoppingCart,
  Clock,
  Gift
} from 'lucide-react'
import { Customer, CustomerLevel } from '@prisma/client'
import { toast } from 'sonner'

interface CustomerWithDetails extends Customer {
  restaurant: { name: string }
  _count: { 
    transactions: number
    rewards: number
  }
  transactions: Array<{
    id: string
    orderNumber: string
    finalAmount: number
    pointsEarned: number
    transactionDate: Date
  }>
}

const levelLabels = {
  REGULAR: 'Standart',
  BRONZE: 'Bronz',
  SILVER: 'Gümüş',
  GOLD: 'Altın',
  PLATINUM: 'Platin'
}

const levelColors = {
  REGULAR: 'bg-gray-100 text-gray-800 border-gray-200',
  BRONZE: 'bg-amber-100 text-amber-800 border-amber-200',
  SILVER: 'bg-gray-100 text-gray-800 border-gray-300',
  GOLD: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PLATINUM: 'bg-purple-100 text-purple-800 border-purple-200'
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string

  const [customer, setCustomer] = useState<CustomerWithDetails | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchCustomer = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/customers/${customerId}`)
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Müşteri bulunamadı')
          router.push('/admin/customers')
          return
        }
        throw new Error('Failed to fetch customer')
      }
      
      const data = await response.json()
      setCustomer(data.customer)
    } catch (error) {
      console.error('Error fetching customer:', error)
      toast.error('Müşteri bilgileri yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (customerId) {
      fetchCustomer()
    }
  }, [customerId])

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('tr-TR')}₺`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
        </div>
        
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Müşteri bulunamadı</h3>
          <p className="text-gray-500">Bu müşteri mevcut değil veya silinmiş olabilir.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
          <p className="text-gray-600">Müşteri Detayları</p>
        </div>
      </div>

      {/* Customer Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Puan</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{customer.points.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Mevcut bakiye</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Harcama</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(customer.totalSpent || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Tüm zamanlar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">İşlem Sayısı</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{customer._count.transactions}</div>
            <p className="text-xs text-muted-foreground">Toplam alışveriş</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ziyaret Sayısı</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{customer.visitCount || 0}</div>
            <p className="text-xs text-muted-foreground">Toplam ziyaret</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Müşteri Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-1">{customer.name}</h3>
              <Badge className={`text-xs border ${levelColors[customer.level as keyof typeof levelColors]}`}>
                {levelLabels[customer.level as keyof typeof levelLabels]}
              </Badge>
            </div>

            {customer.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{customer.email}</span>
              </div>
            )}

            {customer.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{customer.phone}</span>
              </div>
            )}


            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>Kayıt: {formatDate(customer.createdAt)}</span>
            </div>

            {customer.lastVisit && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>Son ziyaret: {formatDate(customer.lastVisit)}</span>
              </div>
            )}

            {customer.birthDate && (
              <div className="flex items-center gap-2 text-sm">
                <Gift className="h-4 w-4 text-gray-400" />
                <span>Doğum günü: {formatDate(customer.birthDate)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content */}
        <div className="lg:col-span-2">
          <PointHistory 
            customerId={customer.id} 
            customerName={customer.name} 
          />
        </div>
      </div>
    </div>
  )
}