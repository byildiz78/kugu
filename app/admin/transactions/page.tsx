'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { TransactionForm } from '@/components/admin/transactions/transaction-form'
import { TransactionDetailModal } from '@/components/admin/transactions/transaction-detail-modal'
import { DataTable, Column } from '@/components/ui/data-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Plus,
  Receipt,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  ShoppingBag,
  CreditCard,
  Banknote,
  Smartphone,
  Calendar,
  Download,
  Users,
  Package,
  Eye,
  FileSpreadsheet,
  Filter,
  Search,
  X
} from 'lucide-react'
import { Transaction } from '@prisma/client'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

interface TransactionWithDetails extends Transaction {
  customer: { 
    name: string
    email: string
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
}

interface TransactionStats {
  total: number
  completed: number
  pending: number
  totalRevenue: number
  averageOrderValue: number
  todayTransactions: number
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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([])
  const [stats, setStats] = useState<TransactionStats>({
    total: 0,
    completed: 0,
    pending: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    todayTransactions: 0
  })
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithDetails | null>(null)
  
  // Filters - Set default dates to today
  const today = new Date().toISOString().split('T')[0]
  const [searchValue, setSearchValue] = useState('')
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showFilters, setShowFilters] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  const fetchTransactions = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(searchValue && { search: searchValue }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(statusFilter !== 'ALL' && { status: statusFilter })
      })

      const response = await fetch(`/api/transactions?${params}`)
      if (!response.ok) throw new Error('Failed to fetch transactions')
      
      const data = await response.json()
      setTransactions(data.transactions)
      setPagination(data.pagination)
      
      // Calculate stats from all transactions (not just current page)
      await fetchStats()
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Satış kayıtları yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams({
        ...(searchValue && { search: searchValue }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(statusFilter !== 'ALL' && { status: statusFilter })
      })

      const response = await fetch(`/api/transactions?${params}&limit=9999`)
      if (!response.ok) throw new Error('Failed to fetch transaction stats')
      
      const data = await response.json()
      
      // Calculate stats
      const today = new Date().toDateString()
      const todayTransactions = data.transactions.filter((t: TransactionWithDetails) => 
        new Date(t.transactionDate).toDateString() === today
      )
      
      const totalRevenue = data.transactions.reduce(
        (sum: number, t: TransactionWithDetails) => sum + t.finalAmount, 0
      )
      
      const completedTransactions = data.transactions.filter((t: TransactionWithDetails) => 
        t.status === 'COMPLETED'
      )
      const pendingTransactions = data.transactions.filter((t: TransactionWithDetails) => 
        t.status === 'PENDING'
      )
      
      setStats({
        total: data.pagination.total,
        completed: completedTransactions.length,
        pending: pendingTransactions.length,
        totalRevenue,
        averageOrderValue: data.transactions.length > 0 ? totalRevenue / data.transactions.length : 0,
        todayTransactions: todayTransactions.length
      })
    } catch (error) {
      console.error('Error fetching transaction stats:', error)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [searchValue, startDate, endDate, statusFilter])

  const handleCreateTransaction = async (data: any) => {
    try {
      setFormLoading(true)
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error('Failed to create transaction')
      
      toast.success('Satış işlemi başarıyla kaydedildi')
      setFormOpen(false)
      fetchTransactions()
    } catch (error) {
      console.error('Error creating transaction:', error)
      toast.error('Satış işlemi kaydedilirken hata oluştu')
    } finally {
      setFormLoading(false)
    }
  }

  const handleView = (transaction: TransactionWithDetails) => {
    setSelectedTransaction(transaction)
    setDetailModalOpen(true)
  }


  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
    fetchTransactions(newPage)
  }

  const handleExportExcel = async () => {
    try {
      // Fetch all data for export
      const params = new URLSearchParams({
        limit: '99999',
        ...(searchValue && { search: searchValue }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(statusFilter !== 'ALL' && { status: statusFilter })
      })

      const response = await fetch(`/api/transactions?${params}`)
      if (!response.ok) throw new Error('Failed to fetch data for export')
      
      const data = await response.json()
      const exportData = data.transactions.map((t: TransactionWithDetails) => ({
        'Sipariş No': t.orderNumber,
        'Müşteri': t.customer.name,
        'E-posta': t.customer.email,
        'Seviye': t.customer.level,
        'Toplam Tutar': t.totalAmount,
        'İndirim': t.discountAmount,
        'Final Tutar': t.finalAmount,
        'Kazanılan Puan': t.pointsEarned,
        'Kullanılan Puan': t.pointsUsed,
        'Ödeme Yöntemi': paymentLabels[t.paymentMethod as keyof typeof paymentLabels] || t.paymentMethod,
        'Durum': statusLabels[t.status as keyof typeof statusLabels],
        'Tarih': formatDate(t.transactionDate instanceof Date ? t.transactionDate.toISOString() : t.transactionDate),
        'Ürün Sayısı': t.items.length,
        'Notlar': t.notes || ''
      }))

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'İşlemler')

      // Generate filename with date
      const fileName = `islemler_${startDate}_${endDate}.xlsx`
      
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
    setStartDate(today)
    setEndDate(today)
    setStatusFilter('ALL')
  }

  const hasActiveFilters = searchValue || statusFilter !== 'ALL' || startDate !== today || endDate !== today

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }


  // DataTable columns definition
  const columns: Column<TransactionWithDetails>[] = [
    {
      key: 'orderNumber',
      header: 'Sipariş No',
      sortable: true,
      searchable: true,
      render: (item) => (
        <div className="space-y-1">
          <div className="font-medium text-gray-900">{item.orderNumber}</div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Package className="h-3 w-3" />
            {item.items.length} ürün
          </div>
        </div>
      )
    },
    {
      key: 'customer.name',
      header: 'Müşteri',
      sortable: true,
      searchable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {item.customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="font-medium text-gray-900">{item.customer.name}</div>
            <div className="text-sm text-gray-500">{item.customer.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'finalAmount',
      header: 'Tutar',
      sortable: true,
      className: 'text-right',
      render: (item) => (
        <div className="space-y-1">
          <div className="font-bold text-green-700">
            {item.finalAmount.toFixed(0)}₺
          </div>
          {item.discountAmount > 0 && (
            <div className="text-xs text-green-600">
              -{item.discountAmount.toFixed(0)}₺ indirim
            </div>
          )}
        </div>
      )
    },
    {
      key: 'paymentMethod',
      header: 'Ödeme',
      sortable: true,
      render: (item) => {
        const PaymentIcon = paymentIcons[item.paymentMethod as keyof typeof paymentIcons] || Receipt
        return (
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2 py-1">
            <PaymentIcon className="h-4 w-4 text-gray-600" />
            <span className="text-sm">
              {paymentLabels[item.paymentMethod as keyof typeof paymentLabels] || item.paymentMethod}
            </span>
          </div>
        )
      }
    },
    {
      key: 'status',
      header: 'Durum',
      sortable: true,
      render: (item) => {
        const StatusIcon = statusIcons[item.status as keyof typeof statusIcons] || Receipt
        return (
          <Badge className={`text-xs border ${statusColors[item.status as keyof typeof statusColors]}`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusLabels[item.status as keyof typeof statusLabels]}
          </Badge>
        )
      }
    },
    {
      key: 'transactionDate',
      header: 'Tarih',
      sortable: true,
      render: (item) => (
        <div className="space-y-1">
          <div className="text-sm">{formatDate(item.transactionDate instanceof Date ? item.transactionDate.toISOString() : item.transactionDate)}</div>
          {item.pointsEarned > 0 && (
            <div className="text-xs text-blue-600 flex items-center gap-1">
              <Users className="h-3 w-3" />
              +{item.pointsEarned} puan
              {item.tier && (
                <span 
                  className="ml-1 px-1 py-0.5 rounded text-xs font-medium"
                  style={{ 
                    backgroundColor: `${item.tier.color}20`, 
                    color: item.tier.color,
                    border: `1px solid ${item.tier.color}40`
                  }}
                >
                  {item.tier.displayName} ({item.tierMultiplier || item.tier.pointMultiplier}x)
                </span>
              )}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'İşlemler',
      render: (item) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleView(item)}
          className="h-8 px-2"
        >
          <Eye className="h-4 w-4" />
        </Button>
      )
    }
  ]


  const statsCards = [
    {
      title: 'Toplam İşlem',
      value: stats.total.toString(),
      description: `${stats.todayTransactions} bugün`,
      icon: Receipt,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Toplam Ciro',
      value: `${stats.totalRevenue.toFixed(0)}₺`,
      description: 'Tüm satışlar',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Ortalama Sipariş',
      value: `${stats.averageOrderValue.toFixed(0)}₺`,
      description: 'İşlem başına',
      icon: ShoppingBag,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Tamamlanan',
      value: stats.completed.toString(),
      description: `${stats.pending} beklemede`,
      icon: CheckCircle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Satış Kayıtları</h1>
          <p className="text-gray-600">Tüm satış işlemlerini görüntüleyin ve yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fetchTransactions()}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Satış
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

      {/* Transactions DataTable */}
      <Card>
        <CardHeader>
          <CardTitle>Satış İşlemleri</CardTitle>
          <CardDescription>
            Toplam {pagination.total} kayıt bulundu - Kolon başlıklarına tıklayarak sıralayabilirsiniz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={transactions}
            columns={columns}
            loading={loading}
            onRowClick={handleView}
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
                        {[searchValue, statusFilter !== 'ALL', startDate !== today || endDate !== today].filter(Boolean).length}
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
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg border">
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Arama</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          value={searchValue}
                          onChange={(e) => setSearchValue(e.target.value)}
                          placeholder="Sipariş no, müşteri adı veya e-posta..."
                          className="pl-9"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              fetchTransactions(1)
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
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Durum</label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Durum seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-gray-400 mr-2" />
                              Tümü
                            </div>
                          </SelectItem>
                          <SelectItem value="COMPLETED">
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                              Tamamlandı
                            </div>
                          </SelectItem>
                          <SelectItem value="PENDING">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 text-yellow-600 mr-2" />
                              Beklemede
                            </div>
                          </SelectItem>
                          <SelectItem value="CANCELLED">
                            <div className="flex items-center">
                              <XCircle className="h-4 w-4 text-red-600 mr-2" />
                              İptal
                            </div>
                          </SelectItem>
                          <SelectItem value="REFUNDED">
                            <div className="flex items-center">
                              <RefreshCw className="h-4 w-4 text-gray-600 mr-2" />
                              İade
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="md:col-span-4 flex justify-end gap-2 pt-2 border-t">
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

      {/* Transaction Form Dialog */}
      <TransactionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreateTransaction}
        isLoading={formLoading}
      />

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        transaction={selectedTransaction}
      />
    </div>
  )
}