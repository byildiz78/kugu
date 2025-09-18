'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  Award,
  Calendar,
  Users,
  TrendingUp,
  DollarSign,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Target,
  Gift,
  BarChart3,
  Hash,
  User,
  Mail,
  Phone,
  Crown
} from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'

interface CampaignUsageData {
  usages: Array<{
    id: string
    usedAt: string
    orderAmount: number
    discountAmount: number
    campaign: {
      id: string
      name: string
      type: string
      discountType: string
      discountValue: number
    }
    customer: {
      id: string
      name: string
      email: string
      phone: string
      tier?: {
        displayName: string
        color: string
      }
    }
  }>
  summary: {
    totalUsages: number
    totalOrderAmount: number
    totalDiscountGiven: number
    averageDiscount: number
    uniqueCampaigns: number
    uniqueCustomers: number
    campaignTypeBreakdown: Array<{
      type: string
      usage_count: number
      total_discount: number
    }>
    topCampaigns: Array<{
      id: string
      name: string
      type: string
      usageCount: number
      totalDiscount: number
      totalOrderAmount: number
    }>
    topCustomers: Array<{
      id: string
      name: string
      email: string
      tier?: {
        displayName: string
        color: string
      }
      usageCount: number
      totalDiscount: number
      totalOrderAmount: number
    }>
  }
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function CampaignUsagePage() {
  const [data, setData] = useState<CampaignUsageData | null>(null)
  const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchCampaigns()
    fetchUsageData()
  }, [])

  useEffect(() => {
    fetchUsageData()
  }, [page])

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns')
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns)
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    }
  }

  const fetchUsageData = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        page: page.toString(),
        limit: '50'
      })

      if (selectedCampaign && selectedCampaign !== 'all') {
        params.append('campaignId', selectedCampaign)
      }

      const response = await fetch(`/api/campaign-usage?${params}`)
      if (response.ok) {
        const data = await response.json()
        setData(data)
      } else {
        toast.error('Veri yüklenirken hata oluştu')
      }
    } catch (error) {
      console.error('Error fetching usage data:', error)
      toast.error('Bağlantı hatası')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilter = () => {
    setPage(1)
    fetchUsageData()
  }

  const getCampaignTypeBadge = (type: string) => {
    const typeMap: Record<string, { label: string; variant: any }> = {
      DISCOUNT: { label: 'İndirim', variant: 'default' },
      PRODUCT_BASED: { label: 'Damga', variant: 'secondary' },
      LOYALTY_POINTS: { label: 'Puan', variant: 'outline' },
      TIME_BASED: { label: 'Zaman Bazlı', variant: 'secondary' },
      BIRTHDAY_SPECIAL: { label: 'Doğum Günü', variant: 'default' },
      COMBO_DEAL: { label: 'Kombo', variant: 'secondary' },
      BUY_X_GET_Y: { label: 'Al X Kazan Y', variant: 'default' }
    }
    const config = typeMap[type] || { label: type, variant: 'default' }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount)
  }

  const exportToCSV = () => {
    if (!data) return

    const csvData = data.usages.map(usage => ({
      'Tarih': format(new Date(usage.usedAt), 'dd/MM/yyyy HH:mm', { locale: tr }),
      'Müşteri': usage.customer.name,
      'E-posta': usage.customer.email,
      'Telefon': usage.customer.phone || '-',
      'Seviye': usage.customer.tier?.displayName || '-',
      'Kampanya': usage.campaign.name,
      'Kampanya Tipi': usage.campaign.type,
      'Sipariş Tutarı': usage.orderAmount,
      'İndirim Tutarı': usage.discountAmount
    }))

    const headers = Object.keys(csvData[0])
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `kampanya-kullanimlari-${startDate}-${endDate}.csv`
    link.click()
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="h-8 w-8 text-orange-500" />
            Kampanya Kullanımları
          </h1>
          <p className="text-gray-500 mt-1">
            Kampanya kullanım detaylarını ve performans metriklerini görüntüleyin
          </p>
        </div>
        <Button onClick={exportToCSV} disabled={!data || data.usages.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          CSV İndir
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtreler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Başlangıç Tarihi</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Bitiş Tarihi</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Kampanya</Label>
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger>
                  <SelectValue placeholder="Tüm kampanyalar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm kampanyalar</SelectItem>
                  {campaigns.map(campaign => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleFilter} className="w-full" disabled={isLoading}>
                {isLoading ? 'Yükleniyor...' : 'Filtrele'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Toplam Kullanım
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {data.summary.totalUsages.toLocaleString('tr-TR')}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {data.summary.uniqueCampaigns} farklı kampanya
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Benzersiz Müşteri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {data.summary.uniqueCustomers.toLocaleString('tr-TR')}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Kampanya kullanan müşteriler
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Toplam İndirim
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(data.summary.totalDiscountGiven)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Ortalama: {formatCurrency(data.summary.averageDiscount)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Sipariş Tutarı
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.summary.totalOrderAmount)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                İndirim öncesi toplam
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Charts */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                En Çok Kullanılan Kampanyalar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.summary.topCampaigns.map((campaign, index) => (
                  <div key={campaign.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{campaign.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getCampaignTypeBadge(campaign.type)}
                          <span className="text-xs text-gray-500">
                            {campaign.usageCount} kullanım
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-orange-600">
                        {formatCurrency(campaign.totalDiscount)}
                      </p>
                      <p className="text-xs text-gray-500">indirim</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Customers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                En Aktif Müşteriler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.summary.topCustomers.map((customer, index) => (
                  <div key={customer.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {customer.tier && (
                            <Badge
                              style={{
                                backgroundColor: `${customer.tier.color}20`,
                                color: customer.tier.color,
                                borderColor: customer.tier.color
                              }}
                              variant="outline"
                            >
                              {customer.tier.displayName}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {customer.usageCount} kullanım
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-orange-600">
                        {formatCurrency(customer.totalDiscount)}
                      </p>
                      <p className="text-xs text-gray-500">tasarruf</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Usage Table */}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Kullanım Detayları</CardTitle>
            <CardDescription>
              {data.pagination.total} kullanımdan {((page - 1) * 50) + 1}-{Math.min(page * 50, data.pagination.total)} arası gösteriliyor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Müşteri</TableHead>
                    <TableHead>Kampanya</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead className="text-right">Sipariş</TableHead>
                    <TableHead className="text-right">İndirim</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.usages.map((usage) => (
                    <TableRow key={usage.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {format(new Date(usage.usedAt), 'dd MMM yyyy HH:mm', { locale: tr })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{usage.customer.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {usage.customer.tier && (
                              <Badge
                                style={{
                                  backgroundColor: `${usage.customer.tier.color}20`,
                                  color: usage.customer.tier.color,
                                  borderColor: usage.customer.tier.color
                                }}
                                variant="outline"
                                className="text-xs"
                              >
                                {usage.customer.tier.displayName}
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">{usage.customer.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{usage.campaign.name}</p>
                        {usage.campaign.discountType === 'PERCENTAGE' && (
                          <p className="text-xs text-gray-500">%{usage.campaign.discountValue} indirim</p>
                        )}
                        {usage.campaign.discountType === 'FIXED_AMOUNT' && (
                          <p className="text-xs text-gray-500">{formatCurrency(usage.campaign.discountValue)} indirim</p>
                        )}
                      </TableCell>
                      <TableCell>{getCampaignTypeBadge(usage.campaign.type)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(usage.orderAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium text-orange-600">
                          {formatCurrency(usage.discountAmount)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {data.pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-500">
                  Toplam {data.pagination.pages} sayfa
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Önceki
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, data.pagination.pages) }, (_, i) => {
                      let pageNumber
                      if (data.pagination.pages <= 5) {
                        pageNumber = i + 1
                      } else if (page <= 3) {
                        pageNumber = i + 1
                      } else if (page >= data.pagination.pages - 2) {
                        pageNumber = data.pagination.pages - 4 + i
                      } else {
                        pageNumber = page - 2 + i
                      }

                      return (
                        <Button
                          key={i}
                          variant={pageNumber === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPage(pageNumber)}
                        >
                          {pageNumber}
                        </Button>
                      )
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))}
                    disabled={page === data.pagination.pages}
                  >
                    Sonraki
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {data && data.usages.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Award className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-1">
              Kampanya kullanımı bulunamadı
            </p>
            <p className="text-sm text-gray-500">
              Seçilen tarih aralığında kampanya kullanımı bulunmamaktadır.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}