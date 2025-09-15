'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  Plus, 
  Receipt, 
  TrendingUp, 
  DollarSign,
  Search, 
  Eye,
  Filter,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  Users,
  Package,
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Transaction } from '@prisma/client'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface TransactionWithDetails extends Transaction {
  customer: { 
    name: string
    email: string
    level: string
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

interface EnhancedTransactionsViewProps {
  transactions: TransactionWithDetails[]
  stats: TransactionStats
  loading: boolean
  onView: (transaction: TransactionWithDetails) => void
  searchValue: string
  onSearchChange: (value: string) => void
  dateFilter: string
  onDateFilterChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
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

export function EnhancedTransactionsView({
  transactions,
  stats,
  loading,
  onView,
  searchValue,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  statusFilter,
  onStatusFilterChange,
  currentPage,
  totalPages,
  onPageChange
}: EnhancedTransactionsViewProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithDetails | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const handleTransactionClick = (transaction: TransactionWithDetails) => {
    setSelectedTransaction(transaction)
    setModalOpen(true)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: tr })
  }

  const getStatusIcon = (status: string) => {
    const Icon = statusIcons[status as keyof typeof statusIcons] || Receipt
    return <Icon className="h-4 w-4" />
  }

  const getPaymentIcon = (method: string) => {
    const Icon = paymentIcons[method as keyof typeof paymentIcons] || Receipt
    return <Icon className="h-4 w-4" />
  }

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

      {/* Filters and Controls */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg">Satış İşlemleri</CardTitle>
              <CardDescription>
                Tüm satış işlemlerini görüntüleyin ve detaylarını inceleyin
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Sipariş numarası veya müşteri adı ile ara..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => onDateFilterChange(e.target.value)}
                className="w-40"
              />
            </div>

            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="w-[150px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tümü</SelectItem>
                <SelectItem value="COMPLETED">Tamamlandı</SelectItem>
                <SelectItem value="PENDING">Beklemede</SelectItem>
                <SelectItem value="CANCELLED">İptal</SelectItem>
                <SelectItem value="REFUNDED">İade</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {transactions.length} işlem gösteriliyor
            </div>
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 px-3"
              >
                Kart
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 px-3"
              >
                Liste
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Display */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        </div>
      ) : transactions.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Receipt className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">
                {searchValue ? 'Arama kriterinize uygun işlem bulunamadı' : 'Henüz işlem kaydı bulunmuyor'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            : "space-y-3"
        }>
          {transactions.map((transaction) => {
            const PaymentIcon = paymentIcons[transaction.paymentMethod as keyof typeof paymentIcons] || Receipt
            const StatusIcon = statusIcons[transaction.status as keyof typeof statusIcons] || Receipt
            
            return (
              <Card 
                key={transaction.id} 
                className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-blue-200"
                onClick={() => handleTransactionClick(transaction)}
              >
                {viewMode === 'grid' ? (
                  <CardContent className="p-0">
                    {/* Header with gradient background */}
                    <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-500">
                      <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Receipt className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-white">{transaction.orderNumber}</h3>
                            <div className="text-xs text-white/80 flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {transaction.customer.name}
                            </div>
                          </div>
                        </div>
                        {/* Amount */}
                        <div className="text-center bg-white/20 rounded-lg px-3 py-2 backdrop-blur-sm">
                          <div className="text-xl font-bold text-white">
                            {transaction.finalAmount.toFixed(0)}₺
                          </div>
                          <div className="text-xs text-white/80">tutar</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-4 space-y-3">
                      {/* Customer & Payment Info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {transaction.customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{transaction.customer.name}</div>
                            <div className="text-xs text-gray-500">{transaction.customer.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1">
                          <PaymentIcon className="h-3 w-3 text-gray-600" />
                          <span className="text-xs text-gray-600">
                            {paymentLabels[transaction.paymentMethod as keyof typeof paymentLabels]}
                          </span>
                        </div>
                      </div>
                      
                      {/* Status & Date */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <Badge className={`text-xs border ${statusColors[transaction.status as keyof typeof statusColors]}`}>
                          {React.cloneElement(getStatusIcon(transaction.status), { className: 'h-3 w-3 mr-1' })}
                          {statusLabels[transaction.status as keyof typeof statusLabels]}
                        </Badge>
                        <div className="text-xs text-gray-500">
                          {formatDate(transaction.transactionDate instanceof Date ? transaction.transactionDate.toISOString() : transaction.transactionDate)}
                        </div>
                      </div>
                      
                      {/* Item Count */}
                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-blue-50 rounded-lg px-3 py-2">
                        <Package className="h-3 w-3" />
                        <span>{transaction.items.length} ürün</span>
                        {transaction.discountAmount > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-green-600 font-medium">
                              -{transaction.discountAmount.toFixed(2)}₺ indirim
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                ) : (
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Order Icon */}
                      <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                        <Receipt className="h-5 w-5 text-blue-600" />
                      </div>
                      
                      {/* Order Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{transaction.orderNumber}</h3>
                          <Badge className={`text-xs border ${statusColors[transaction.status as keyof typeof statusColors]}`}>
                            {React.cloneElement(getStatusIcon(transaction.status), { className: 'h-3 w-3 mr-1' })}
                            {statusLabels[transaction.status as keyof typeof statusLabels]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {transaction.customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{transaction.customer.name}</span>
                          <span>•</span>
                          <Package className="h-3 w-3" />
                          <span>{transaction.items.length} ürün</span>
                        </div>
                      </div>
                      
                      {/* Payment Method */}
                      <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 shrink-0">
                        <PaymentIcon className="h-4 w-4 text-gray-600" />
                        <span className="text-sm text-gray-600">
                          {paymentLabels[transaction.paymentMethod as keyof typeof paymentLabels]}
                        </span>
                      </div>
                      
                      {/* Amount */}
                      <div className="text-center bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-100 px-4 py-2 shrink-0">
                        <div className="text-lg font-bold text-green-700">
                          {transaction.finalAmount.toFixed(0)}₺
                        </div>
                        {transaction.discountAmount > 0 && (
                          <div className="text-xs text-green-600 font-medium">
                            -{transaction.discountAmount.toFixed(0)}₺ indirim
                          </div>
                        )}
                      </div>
                      
                      {/* Date */}
                      <div className="text-center text-sm shrink-0 min-w-[100px]">
                        <div className="text-gray-600 font-medium">{format(new Date(transaction.transactionDate), 'dd MMM', { locale: tr })}</div>
                        <div className="text-xs text-gray-500">{format(new Date(transaction.transactionDate), 'HH:mm', { locale: tr })}</div>
                      </div>
                      
                      {/* View Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs hover:bg-blue-50 shrink-0"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && transactions.length > 0 && totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Sayfa {currentPage} / {totalPages} ({stats.total} toplam işlem)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page: number;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => onPageChange(page)}
                        className="h-8 w-8 p-0"
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction Detail Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              İşlem Detayları - {selectedTransaction?.orderNumber}
            </DialogTitle>
            <DialogDescription>
              Satış işleminin tüm detaylarını görüntüleyin
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-6">
              {/* Transaction Overview */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Receipt className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold">{selectedTransaction.orderNumber}</div>
                        <div className="text-sm text-gray-500">Sipariş Numarası</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-semibold">{selectedTransaction.finalAmount.toFixed(2)}₺</div>
                        <div className="text-sm text-gray-500">Toplam Tutar</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Müşteri Bilgileri
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {selectedTransaction.customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{selectedTransaction.customer.name}</div>
                      <div className="text-sm text-gray-500">{selectedTransaction.customer.email}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Products */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Satılan Ürünler ({selectedTransaction.items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedTransaction.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-sm text-gray-500">
                            {item.quantity} adet × {item.unitPrice.toFixed(2)}₺
                          </div>
                        </div>
                        <div className="font-semibold text-lg">
                          {item.totalPrice.toFixed(2)}₺
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Payment & Status */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Ödeme Yöntemi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {selectedTransaction.paymentMethod && React.cloneElement(getPaymentIcon(selectedTransaction.paymentMethod), { className: 'h-5 w-5 text-gray-600' })}
                      <span className="font-medium">
                        {selectedTransaction.paymentMethod 
                          ? paymentLabels[selectedTransaction.paymentMethod as keyof typeof paymentLabels]
                          : 'Belirtilmemiş'
                        }
                      </span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">İşlem Durumu</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge className={`${statusColors[selectedTransaction.status as keyof typeof statusColors]}`}>
                      {React.cloneElement(getStatusIcon(selectedTransaction.status), { className: 'h-4 w-4 mr-2' })}
                      {statusLabels[selectedTransaction.status as keyof typeof statusLabels]}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* Transaction Date */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">İşlem Tarihi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{formatDate(selectedTransaction.transactionDate instanceof Date ? selectedTransaction.transactionDate.toISOString() : selectedTransaction.transactionDate)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Applied Campaigns */}
              {selectedTransaction.appliedCampaigns.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Uygulanan Kampanyalar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedTransaction.appliedCampaigns.map((campaign, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div>
                            <div className="font-medium">{campaign.campaign.name}</div>
                            <div className="text-sm text-gray-500">{campaign.campaign.type}</div>
                          </div>
                          <div className="font-semibold text-green-600">
                            -{campaign.discountAmount.toFixed(2)}₺
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}