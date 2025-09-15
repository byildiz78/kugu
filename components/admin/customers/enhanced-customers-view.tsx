'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Plus, 
  Target, 
  Users, 
  TrendingUp, 
  Search, 
  RefreshCw, 
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Settings,
  Filter,
  Calendar,
  Award,
  Phone,
  Mail,
  Star,
  CreditCard,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Customer, CustomerLevel } from '@prisma/client'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface CustomerWithDetails extends Customer {
  restaurant: { name: string }
  tier?: {
    id: string
    name: string
    displayName: string
    color: string
    gradient: string | null
    icon: string | null
    level: number
    pointMultiplier: number
  }
  _count: { transactions: number }
}

interface CustomerStats {
  total: number
  newThisMonth: number
  activeCustomers: number
  averagePoints: number
}

interface EnhancedCustomersViewProps {
  customers: CustomerWithDetails[]
  stats: CustomerStats
  loading: boolean
  onEdit: (customer: CustomerWithDetails) => void
  onDelete: (customer: CustomerWithDetails) => void
  onView: (customer: CustomerWithDetails) => void
  searchValue: string
  onSearchChange: (value: string) => void
  levelFilter: string
  onLevelFilterChange: (value: string) => void
  onClearFilters: () => void
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

const levelColors = {
  REGULAR: 'bg-gray-100 text-gray-800',
  BRONZE: 'bg-amber-100 text-amber-800',
  SILVER: 'bg-slate-100 text-slate-800',
  GOLD: 'bg-yellow-100 text-yellow-800',
  PLATINUM: 'bg-purple-100 text-purple-800'
}

const levelLabels = {
  REGULAR: 'Normal',
  BRONZE: 'Bronz',
  SILVER: 'Gümüş',
  GOLD: 'Altın',
  PLATINUM: 'Platin'
}

const levelGradients = {
  REGULAR: 'from-gray-400 to-gray-500',
  BRONZE: 'from-amber-400 to-orange-500',
  SILVER: 'from-slate-400 to-slate-500',
  GOLD: 'from-yellow-400 to-yellow-600',
  PLATINUM: 'from-purple-400 to-purple-600'
}

export function EnhancedCustomersView({
  customers,
  stats,
  loading,
  onEdit,
  onDelete,
  onView,
  searchValue,
  onSearchChange,
  levelFilter,
  onLevelFilterChange,
  onClearFilters,
  currentPage,
  totalPages,
  onPageChange
}: EnhancedCustomersViewProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [sortBy, setSortBy] = useState<'name' | 'points' | 'transactions' | 'created'>('name')

  const filteredCustomers = customers.sort((a, b) => {
    switch (sortBy) {
      case 'points':
        return b.points - a.points
      case 'transactions':
        return b._count.transactions - a._count.transactions
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      default:
        return a.name.localeCompare(b.name)
    }
  })

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy', { locale: tr })
  }

  const getCustomerIcon = (level: CustomerLevel) => {
    switch (level) {
      case 'PLATINUM':
        return <Star className="h-5 w-5 text-purple-500" />
      case 'GOLD':
        return <Award className="h-5 w-5 text-yellow-500" />
      case 'SILVER':
        return <Award className="h-5 w-5 text-slate-500" />
      case 'BRONZE':
        return <Award className="h-5 w-5 text-amber-500" />
      default:
        return <Users className="h-5 w-5 text-gray-500" />
    }
  }

  const statsCards = [
    {
      title: 'Toplam Müşteri',
      value: stats.total.toString(),
      description: `${stats.newThisMonth} yeni bu ay`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Aktif Müşteri',
      value: stats.activeCustomers.toString(),
      description: 'En az 1 işlem yapmış',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Ortalama Puan',
      value: stats.averagePoints.toString(),
      description: 'Müşteri başına',
      icon: Award,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    {
      title: 'Bu Ay Yeni',
      value: stats.newThisMonth.toString(),
      description: 'Yeni kayıt olan',
      icon: UserPlus,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
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
              <CardTitle className="text-lg">Müşteri Listesi</CardTitle>
              <CardDescription>
                Müşterilerinizi görüntüleyin ve yönetin
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
                placeholder="Müşteri adı, email ile ara..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={levelFilter || 'ALL'} onValueChange={onLevelFilterChange}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tüm Seviyeler</SelectItem>
                  <SelectItem value="REGULAR">Normal</SelectItem>
                  <SelectItem value="BRONZE">Bronz</SelectItem>
                  <SelectItem value="SILVER">Gümüş</SelectItem>
                  <SelectItem value="GOLD">Altın</SelectItem>
                  <SelectItem value="PLATINUM">Platin</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">İsme Göre</SelectItem>
                  <SelectItem value="points">Puana Göre</SelectItem>
                  <SelectItem value="transactions">İşlem Sayısı</SelectItem>
                  <SelectItem value="created">Kayıt Tarihi</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={onClearFilters}>
                Temizle
              </Button>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {filteredCustomers.length} müşteri gösteriliyor
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

      {/* Customers Display */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">
                {searchValue ? 'Arama kriterinize uygun müşteri bulunamadı' : 'Henüz müşteri eklenmemiş'}
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
          {filteredCustomers.map((customer) => (
            <Card 
              key={customer.id} 
              className="hover:shadow-lg transition-all cursor-pointer border"
              onClick={() => onView(customer)}
            >
              {viewMode === 'grid' ? (
                <CardContent className="p-0">
                  {/* Header with level-based gradient */}
                  <div className={`p-4 bg-gradient-to-r ${customer.tier?.gradient || levelGradients[customer.level]}`}>
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-white/20">
                          <AvatarFallback className="bg-white/20 text-white font-bold">
                            {customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-bold text-lg text-white">{customer.name}</h3>
                          <div className="text-xs text-white/80 flex items-center gap-1">
                            {getCustomerIcon(customer.level)}
                            {customer.tier?.displayName || levelLabels[customer.level]}
                            {customer.tier && (
                              <span className="ml-1 text-xs opacity-90">({customer.tier.pointMultiplier}x)</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Points */}
                      <div className="text-center bg-white/20 rounded-lg px-3 py-2 backdrop-blur-sm">
                        <div className="text-xl font-bold text-white">
                          {customer.points.toLocaleString()}
                        </div>
                        <div className="text-xs text-white/80">puan</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-4 space-y-3">
                    {/* Contact Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                      {customer.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-3 w-3" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Stats */}
                    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-700">
                          {customer._count.transactions}
                        </div>
                        <div className="text-xs text-gray-600">işlem</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-600">{formatDate(customer.createdAt instanceof Date ? customer.createdAt.toISOString() : customer.createdAt)}</div>
                        <div className="text-xs text-gray-500">kayıt</div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(customer)
                        }}
                        className="h-8 px-3 text-xs border-gray-200 hover:border-green-300 hover:bg-green-50 flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Düzenle
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(customer)
                        }}
                        className="h-8 px-2 text-xs text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              ) : (
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarFallback 
                        className="font-bold text-sm"
                        style={customer.tier ? {
                          backgroundColor: `${customer.tier.color}20`,
                          color: customer.tier.color
                        } : undefined}
                      >
                        {customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Customer Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{customer.name}</h3>
                        {customer.tier ? (
                          <Badge 
                            className="text-xs shrink-0"
                            style={{
                              backgroundColor: `${customer.tier.color}20`,
                              color: customer.tier.color,
                              border: `1px solid ${customer.tier.color}40`
                            }}
                          >
                            {customer.tier.displayName} ({customer.tier.pointMultiplier}x)
                          </Badge>
                        ) : (
                          <Badge className={`text-xs shrink-0 ${levelColors[customer.level]}`}>
                            {levelLabels[customer.level]}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 truncate">{customer.email}</div>
                      {customer.phone && (
                        <div className="text-xs text-gray-500">{customer.phone}</div>
                      )}
                    </div>
                    
                    {/* Points */}
                    <div className="text-center bg-blue-50 rounded-lg px-4 py-2 shrink-0">
                      <div className="text-xl font-bold text-blue-700">
                        {customer.points.toLocaleString()}
                      </div>
                      <div className="text-xs text-blue-600">puan</div>
                    </div>
                    
                    {/* Transactions */}
                    <div className="text-center shrink-0">
                      <div className="text-lg font-bold text-gray-700">
                        {customer._count.transactions}
                      </div>
                      <div className="text-xs text-gray-600">işlem</div>
                    </div>
                    
                    {/* Registration Date */}
                    <div className="text-center text-sm shrink-0 min-w-[80px]">
                      <div className="text-gray-600">{formatDate(customer.createdAt instanceof Date ? customer.createdAt.toISOString() : customer.createdAt)}</div>
                      <div className="text-xs text-gray-500">kayıt</div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(customer)
                        }}
                        className="h-8 px-3 text-xs"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Düzenle
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(customer)
                        }}
                        className="h-8 px-2 text-xs text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredCustomers.length > 0 && totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Sayfa {currentPage} / {totalPages} ({stats.total} toplam müşteri)
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
    </div>
  )
}