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
import { DataTable, Column } from '@/components/ui/data-table'
import { 
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Users,
  Star,
  Clock,
  Gift,
  ShoppingCart,
  Award,
  Download,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  FileSpreadsheet,
  X
} from 'lucide-react'
import { PointHistory as PointHistoryModel, PointTransactionType } from '@prisma/client'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

interface PointHistoryWithDetails extends PointHistoryModel {
  customer: {
    name: string
    email: string
  }
}

interface PointTransactionStats {
  totalEarned: number
  totalSpent: number
  totalExpired: number
  netBalance: number
}

const typeLabels = {
  EARNED: 'Kazanılan',
  SPENT: 'Harcanan',
  EXPIRED: 'Süresi Dolmuş'
}

const typeColors = {
  EARNED: 'bg-green-100 text-green-800 border-green-200',
  SPENT: 'bg-red-100 text-red-800 border-red-200',
  EXPIRED: 'bg-gray-100 text-gray-800 border-gray-200'
}

const typeIcons = {
  EARNED: Plus,
  SPENT: Minus,
  EXPIRED: Clock
}

const sourceIcons: Record<string, any> = {
  PURCHASE: ShoppingCart,
  REWARD: Gift,
  BONUS: Award,
  MANUAL: Clock,
  CAMPAIGN: TrendingUp
}

const sourceLabels: Record<string, string> = {
  PURCHASE: 'Alışveriş',
  REWARD: 'Ödül',
  BONUS: 'Bonus',
  MANUAL: 'Manuel',
  CAMPAIGN: 'Kampanya'
}

export default function PointTransactionsPage() {
  const [pointHistory, setPointHistory] = useState<PointHistoryWithDetails[]>([])
  const [stats, setStats] = useState<PointTransactionStats>({
    totalEarned: 0,
    totalSpent: 0,
    totalExpired: 0,
    netBalance: 0
  })
  const [loading, setLoading] = useState(true)
  
  // Filters - Set default dates to today
  const today = new Date().toISOString().split('T')[0]
  const [searchValue, setSearchValue] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [showFilters, setShowFilters] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  const fetchPointHistory = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(searchValue && { search: searchValue }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(sourceFilter !== 'all' && { source: sourceFilter }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      })

      const response = await fetch(`/api/point-history/all?${params}`)
      if (!response.ok) throw new Error('Failed to fetch point history')
      
      const data = await response.json()
      setPointHistory(data.pointHistory)
      setPagination(data.pagination)
      
      // Calculate stats from all point history (not just current page)
      await fetchStats()
    } catch (error) {
      console.error('Error fetching point history:', error)
      toast.error('Puan hareketleri yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams({
        ...(searchValue && { search: searchValue }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(sourceFilter !== 'all' && { source: sourceFilter }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      })

      const response = await fetch(`/api/point-history/stats?${params}`)
      if (!response.ok) throw new Error('Failed to fetch stats')
      
      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  useEffect(() => {
    fetchPointHistory()
  }, [searchValue, typeFilter, sourceFilter, startDate, endDate])

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSourceIcon = (source: string) => {
    const IconComponent = sourceIcons[source] || Clock
    return IconComponent
  }

  const getSourceLabel = (source: string) => {
    return sourceLabels[source] || source
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
    fetchPointHistory(newPage)
  }

  const handleExportExcel = async () => {
    try {
      // Fetch all data for export
      const params = new URLSearchParams({
        limit: '99999',
        ...(searchValue && { search: searchValue }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(sourceFilter !== 'all' && { source: sourceFilter }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      })

      const response = await fetch(`/api/point-history/all?${params}`)
      if (!response.ok) throw new Error('Failed to fetch data for export')
      
      const data = await response.json()
      const exportData = data.pointHistory.map((p: PointHistoryWithDetails) => ({
        'Müşteri': p.customer.name,
        'E-posta': p.customer.email,
        'İşlem Türü': typeLabels[p.type as keyof typeof typeLabels] || p.type,
        'Kaynak': getSourceLabel(p.source),
        'Miktar': p.amount,
        'Bakiye': p.balance,
        'Açıklama': p.description || '',
        'Tarih': formatDate(p.createdAt.toString()),
        'Son Geçerlilik': p.expiresAt ? formatDate(p.expiresAt.toString()) : ''
      }))

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Puan Hareketleri')

      // Generate filename with date
      const fileName = `puan_hareketleri_${startDate}_${endDate}.xlsx`
      
      // Save file
      XLSX.writeFile(wb, fileName)
      toast.success('Excel dosyası başarıyla indirildi')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Export işlemi başarısız oldu')
    }
  }

  const handleClearFilters = () => {
    setSearchValue('')
    setTypeFilter('all')
    setSourceFilter('all')
    setStartDate(today)
    setEndDate(today)
  }

  const hasActiveFilters = searchValue || typeFilter !== 'all' || sourceFilter !== 'all' || startDate !== today || endDate !== today

  // DataTable columns definition
  const columns: Column<PointHistoryWithDetails>[] = [
    {
      key: 'customer.name',
      header: 'Müşteri',
      sortable: true,
      searchable: true,
      render: (item) => (
        <div className="space-y-1">
          <div className="font-medium text-gray-900">{item.customer.name}</div>
          <div className="text-sm text-gray-500">{item.customer.email}</div>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Tür',
      sortable: true,
      render: (item) => {
        const TypeIcon = typeIcons[item.type as keyof typeof typeIcons] || Clock
        return (
          <Badge className={`text-xs border ${typeColors[item.type as keyof typeof typeColors]}`}>
            <TypeIcon className="h-3 w-3 mr-1" />
            {typeLabels[item.type as keyof typeof typeLabels]}
          </Badge>
        )
      }
    },
    {
      key: 'source',
      header: 'Kaynak',
      sortable: true,
      render: (item) => {
        const SourceIcon = getSourceIcon(item.source)
        return (
          <div className="flex items-center gap-2">
            <SourceIcon className="h-4 w-4 text-gray-600" />
            <span className="text-sm">{getSourceLabel(item.source)}</span>
          </div>
        )
      }
    },
    {
      key: 'amount',
      header: 'Miktar',
      sortable: true,
      className: 'text-right',
      render: (item) => {
        const isPositive = item.amount > 0
        return (
          <div className={`font-semibold flex items-center justify-end gap-1 ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositive ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
            {Math.abs(item.amount).toLocaleString()}
          </div>
        )
      }
    },
    {
      key: 'balance',
      header: 'Bakiye',
      sortable: true,
      className: 'text-right',
      render: (item) => (
        <div className="font-medium text-gray-900">
          {item.balance.toLocaleString()}
        </div>
      )
    },
    {
      key: 'description',
      header: 'Açıklama',
      searchable: true,
      render: (item) => (
        <div className="max-w-xs truncate" title={item.description || ''}>
          {item.description || '-'}
        </div>
      )
    },
    {
      key: 'createdAt',
      header: 'Tarih',
      sortable: true,
      render: (item) => (
        <div className="space-y-1">
          <div className="text-sm">{formatDate(item.createdAt.toString())}</div>
          {item.expiresAt && (
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(item.expiresAt.toString())}
            </div>
          )}
        </div>
      )
    }
  ]

  const statsCards = [
    {
      title: 'Toplam Kazanılan',
      value: stats.totalEarned.toLocaleString(),
      description: 'Puan',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Toplam Harcanan',
      value: Math.abs(stats.totalSpent).toLocaleString(),
      description: 'Puan',
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Süresi Dolmuş',
      value: Math.abs(stats.totalExpired).toLocaleString(),
      description: 'Puan',
      icon: Clock,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    },
    {
      title: 'Net Bakiye',
      value: stats.netBalance.toLocaleString(),
      description: 'Puan',
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Para Puan Hareketleri</h1>
          <p className="text-gray-600">Tüm müşterilerin puan kazanma ve harcama geçmişi</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fetchPointHistory()}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
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

      {/* Point History DataTable */}
      <Card>
        <CardHeader>
          <CardTitle>Puan Hareketleri</CardTitle>
          <CardDescription>
            Toplam {pagination.total} kayıt bulundu - Kolon başlıklarına tıklayarak sıralayabilirsiniz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={pointHistory}
            columns={columns}
            loading={loading}
            hideSearch={true}
            pagination={{
              page: pagination.page,
              limit: pagination.limit,
              total: pagination.total,
              pages: pagination.pages,
              onPageChange: handlePageChange
            }}
            filters={
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="text-gray-600"
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Filtreler
                    {hasActiveFilters && (
                      <Badge className="ml-2 h-5 px-1" variant="secondary">
                        {[searchValue, typeFilter !== 'all', sourceFilter !== 'all', startDate !== today || endDate !== today].filter(Boolean).length}
                      </Badge>
                    )}
                  </Button>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="mr-1 h-3 w-3" />
                      Temizle
                    </Button>
                  )}
                </div>
                
                {showFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-gray-50 rounded-lg border">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Arama</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          value={searchValue}
                          onChange={(e) => setSearchValue(e.target.value)}
                          placeholder="Müşteri adı, e-posta..."
                          className="pl-9"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              fetchPointHistory(1)
                            }
                          }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Başlangıç Tarihi</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Bitiş Tarihi</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">İşlem Türü</label>
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tür seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-gray-400 mr-2" />
                              Tümü
                            </div>
                          </SelectItem>
                          <SelectItem value="EARNED">
                            <div className="flex items-center">
                              <Plus className="h-4 w-4 text-green-600 mr-2" />
                              Kazanılan
                            </div>
                          </SelectItem>
                          <SelectItem value="SPENT">
                            <div className="flex items-center">
                              <Minus className="h-4 w-4 text-red-600 mr-2" />
                              Harcanan
                            </div>
                          </SelectItem>
                          <SelectItem value="EXPIRED">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 text-gray-600 mr-2" />
                              Süresi Dolmuş
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Kaynak</label>
                      <Select value={sourceFilter} onValueChange={setSourceFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Kaynak seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-gray-400 mr-2" />
                              Tümü
                            </div>
                          </SelectItem>
                          <SelectItem value="PURCHASE">
                            <div className="flex items-center">
                              <ShoppingCart className="h-4 w-4 text-blue-600 mr-2" />
                              Alışveriş
                            </div>
                          </SelectItem>
                          <SelectItem value="REWARD">
                            <div className="flex items-center">
                              <Gift className="h-4 w-4 text-purple-600 mr-2" />
                              Ödül
                            </div>
                          </SelectItem>
                          <SelectItem value="BONUS">
                            <div className="flex items-center">
                              <Award className="h-4 w-4 text-yellow-600 mr-2" />
                              Bonus
                            </div>
                          </SelectItem>
                          <SelectItem value="MANUAL">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 text-gray-600 mr-2" />
                              Manuel
                            </div>
                          </SelectItem>
                          <SelectItem value="CAMPAIGN">
                            <div className="flex items-center">
                              <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
                              Kampanya
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="md:col-span-5 flex justify-end gap-2 pt-2 border-t">
                      <div className="text-xs text-gray-500">
                        {pagination.total} kayıt bulundu
                      </div>
                    </div>
                  </div>
                )}
              </div>
            }
            actions={
              <Button variant="outline" onClick={handleExportExcel}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel İndir
              </Button>
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}