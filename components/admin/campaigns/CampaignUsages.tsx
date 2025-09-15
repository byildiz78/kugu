'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, Filter, Calendar, TrendingUp, Users, DollarSign, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface CampaignUsage {
  id: string
  campaignId: string
  customerId: string
  usedAt: string
  orderAmount: number
  discountAmount: number
  campaign: {
    name: string
    type: string
  }
  customer: {
    name: string
    email: string
  }
}

interface UsageStats {
  totalUsages: number
  totalSavings: number
  totalOrderValue: number
  averageDiscount: number
  uniqueCustomers: number
  topCampaign: string | null
}

interface CampaignUsagesProps {
  onRefresh: () => void
}

export function CampaignUsages({ onRefresh }: CampaignUsagesProps) {
  const [usages, setUsages] = useState<CampaignUsage[]>([])
  const [stats, setStats] = useState<UsageStats>({
    totalUsages: 0,
    totalSavings: 0,
    totalOrderValue: 0,
    averageDiscount: 0,
    uniqueCustomers: 0,
    topCampaign: null
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [campaignFilter, setCampaignFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchUsages()
  }, [currentPage, searchTerm, campaignFilter, dateFilter])

  const fetchUsages = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(campaignFilter && campaignFilter !== 'ALL' && { campaignType: campaignFilter }),
        ...(dateFilter && dateFilter !== 'ALL' && { dateFilter })
      })

      const response = await fetch(`/api/campaign-usages?${params}`)
      if (!response.ok) throw new Error('Failed to fetch campaign usages')
      
      const data = await response.json()
      setUsages(data.usages || [])
      setStats(data.stats || stats)
    } catch (error) {
      console.error('Error fetching campaign usages:', error)
      toast.error('Kampanya kullanımları yüklenirken hata oluştu')
      // Set empty data on error
      setUsages([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchUsages()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount)
  }

  const getCampaignTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'DISCOUNT': 'bg-blue-100 text-blue-800',
      'PRODUCT_BASED': 'bg-green-100 text-green-800',
      'CATEGORY_DISCOUNT': 'bg-purple-100 text-purple-800',
      'BUY_X_GET_Y': 'bg-orange-100 text-orange-800',
      'LOYALTY_POINTS': 'bg-amber-100 text-amber-800',
      'BIRTHDAY_SPECIAL': 'bg-pink-100 text-pink-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const statsCards = [
    {
      title: 'Toplam Kullanım',
      value: stats.totalUsages.toLocaleString('tr-TR'),
      description: 'Kampanya kullanımı',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Toplam Tasarruf',
      value: formatCurrency(stats.totalSavings),
      description: 'Müşteri tasarrufu',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Sipariş Değeri',
      value: formatCurrency(stats.totalOrderValue),
      description: 'Toplam ciro',
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Benzersiz Müşteri',
      value: stats.uniqueCustomers.toLocaleString('tr-TR'),
      description: 'Farklı müşteri',
      icon: Users,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Campaign Info */}
      {stats.topCampaign && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">En Popüler Kampanya</h3>
                <p className="text-sm text-gray-600">{stats.topCampaign}</p>
              </div>
              <Badge variant="secondary">
                Ortalama %{stats.averageDiscount.toFixed(1)} indirim
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Müşteri adı veya kampanya adı ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={campaignFilter} onValueChange={setCampaignFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Kampanya Türü" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tüm Türler</SelectItem>
                <SelectItem value="DISCOUNT">İndirim</SelectItem>
                <SelectItem value="PRODUCT_BASED">Ürün Bazlı</SelectItem>
                <SelectItem value="CATEGORY_DISCOUNT">Kategori İndirimi</SelectItem>
                <SelectItem value="BUY_X_GET_Y">X Al Y Bedava</SelectItem>
                <SelectItem value="LOYALTY_POINTS">Sadakat Puanı</SelectItem>
                <SelectItem value="BIRTHDAY_SPECIAL">Doğum Günü</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tarih" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tüm Zamanlar</SelectItem>
                <SelectItem value="today">Bugün</SelectItem>
                <SelectItem value="week">Bu Hafta</SelectItem>
                <SelectItem value="month">Bu Ay</SelectItem>
                <SelectItem value="quarter">Bu Çeyrek</SelectItem>
              </SelectContent>
            </Select>

            <Button type="submit">Ara</Button>
            <Button type="button" variant="outline" onClick={fetchUsages}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Usages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Kampanya Kullanım Detayları</CardTitle>
          <CardDescription>
            Tüm kampanya kullanımlarını detaylı olarak görüntüleyin
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          ) : usages.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Henüz kullanım bulunmuyor</h3>
              <p className="text-gray-500">Kampanyalar kullanıldığında burada görünecek</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Kampanya</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead>Sipariş Tutarı</TableHead>
                  <TableHead>İndirim</TableHead>
                  <TableHead>Tasarruf %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usages.map((usage) => (
                  <TableRow key={usage.id}>
                    <TableCell className="font-medium">
                      {formatDate(usage.usedAt)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{usage.customer.name}</div>
                        <div className="text-sm text-gray-500">{usage.customer.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{usage.campaign.name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCampaignTypeColor(usage.campaign.type)}>
                        {usage.campaign.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(usage.orderAmount)}</TableCell>
                    <TableCell className="text-green-600 font-medium">
                      {formatCurrency(usage.discountAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        %{((usage.discountAmount / usage.orderAmount) * 100).toFixed(1)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}