'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Package, 
  Search, 
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  DollarSign,
  Tag,
  CheckCircle,
  XCircle,
  Power,
  PowerOff,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  Utensils,
  Coffee,
  Cookie,
  Wine,
  Pizza,
  Sandwich,
  Salad
} from 'lucide-react'
import { Product } from '@prisma/client'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface ProductWithDetails extends Product {
  restaurant: { 
    name: string 
  }
}

interface ProductStats {
  total: number
  active: number
  inactive: number
  categories: number
  averagePrice: number
}

interface EnhancedProductsViewProps {
  products: ProductWithDetails[]
  stats: ProductStats
  loading: boolean
  onEdit: (product: ProductWithDetails) => void
  onDelete: (product: ProductWithDetails) => void
  onView: (product: ProductWithDetails) => void
  onToggleStatus: (product: ProductWithDetails) => void
  searchValue: string
  onSearchChange: (value: string) => void
  categoryFilter: string
  onCategoryFilterChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

const categoryIcons: { [key: string]: any } = {
  'Ana Yemek': Utensils,
  'İçecek': Coffee,
  'Tatlı': Cookie,
  'Alkol': Wine,
  'Pizza': Pizza,
  'Sandviç': Sandwich,
  'Salata': Salad,
  'default': Package
}

const categoryColors: { [key: string]: string } = {
  'Ana Yemek': 'bg-red-100 text-red-800 border-red-200',
  'İçecek': 'bg-blue-100 text-blue-800 border-blue-200',
  'Tatlı': 'bg-pink-100 text-pink-800 border-pink-200',
  'Alkol': 'bg-purple-100 text-purple-800 border-purple-200',
  'Pizza': 'bg-orange-100 text-orange-800 border-orange-200',
  'Sandviç': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Salata': 'bg-green-100 text-green-800 border-green-200',
  'default': 'bg-gray-100 text-gray-800 border-gray-200'
}

const categoryGradients: { [key: string]: string } = {
  'Ana Yemek': 'from-red-500 to-orange-500',
  'İçecek': 'from-blue-500 to-cyan-500',
  'Tatlı': 'from-pink-500 to-rose-500',
  'Alkol': 'from-purple-500 to-indigo-500',
  'Pizza': 'from-orange-500 to-amber-500',
  'Sandviç': 'from-yellow-500 to-orange-500',
  'Salata': 'from-green-500 to-emerald-500',
  'default': 'from-gray-500 to-slate-500'
}

export function EnhancedProductsView({
  products,
  stats,
  loading,
  onEdit,
  onDelete,
  onView,
  onToggleStatus,
  searchValue,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  statusFilter,
  onStatusFilterChange,
  currentPage,
  totalPages,
  onPageChange
}: EnhancedProductsViewProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  const formatPrice = (price: number) => {
    return price.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy', { locale: tr })
  }

  const getCategoryIcon = (category: string) => {
    const Icon = categoryIcons[category] || categoryIcons['default']
    return <Icon className="h-4 w-4" />
  }

  const getCategoryColor = (category: string) => {
    return categoryColors[category] || categoryColors['default']
  }

  const getCategoryGradient = (category: string) => {
    return categoryGradients[category] || categoryGradients['default']
  }

  const getUniqueCategories = () => {
    const categories = Array.from(new Set(products.map(p => p.category)))
    return categories.sort()
  }

  const statsCards = [
    {
      title: 'Toplam Ürün',
      value: stats.total.toString(),
      description: `${stats.active} aktif, ${stats.inactive} pasif`,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Aktif Ürünler',
      value: stats.active.toString(),
      description: 'Menüde görünen ürünler',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Kategori Sayısı',
      value: stats.categories.toString(),
      description: 'Farklı ürün kategorisi',
      icon: Tag,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Ortalama Fiyat',
      value: `${stats.averagePrice.toFixed(0)}₺`,
      description: 'Ürün başına ortalama',
      icon: DollarSign,
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
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Ürün Listesi
              </CardTitle>
              <CardDescription>
                Menü ürünlerinizi görüntüleyin ve yönetin
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
                placeholder="Ürün adı ile ara..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
              <SelectTrigger className="w-[160px]">
                <Tag className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tüm Kategoriler</SelectItem>
                {getUniqueCategories().map((category) => (
                  <SelectItem key={category} value={category}>
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(category)}
                      {category}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="w-[140px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tümü</SelectItem>
                <SelectItem value="ACTIVE">Aktif</SelectItem>
                <SelectItem value="INACTIVE">Pasif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {products.length} ürün gösteriliyor
            </div>
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 px-3"
              >
                <Grid3X3 className="h-3 w-3 mr-1" />
                Kart
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 px-3"
              >
                <List className="h-3 w-3 mr-1" />
                Liste
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Display */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">
                {searchValue ? 'Arama kriterinize uygun ürün bulunamadı' : 'Henüz ürün eklenmemiş'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            : "space-y-3"
        }>
          {products.map((product) => {
            const CategoryIcon = categoryIcons[product.category] || categoryIcons['default']
            
            return (
              <Card 
                key={product.id} 
                className={`hover:shadow-lg transition-all cursor-pointer border-2 hover:border-green-200 ${
                  !product.isActive ? 'opacity-75' : ''
                }`}
                onClick={() => onView(product)}
              >
                {viewMode === 'grid' ? (
                  <CardContent className="p-0">
                    {/* Header with gradient background */}
                    <div className={`p-4 bg-gradient-to-r ${getCategoryGradient(product.category)}`}>
                      <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <CategoryIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-white line-clamp-1">{product.name}</h3>
                            <div className="text-xs text-white/80 flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {product.category}
                            </div>
                          </div>
                        </div>
                        {/* Price */}
                        <div className="text-center bg-white/20 rounded-lg px-3 py-2 backdrop-blur-sm">
                          <div className="text-xl font-bold text-white">
                            {formatPrice(product.price)}₺
                          </div>
                          <div className="text-xs text-white/80">fiyat</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-4 space-y-3">
                      {/* Description */}
                      <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                        {product.description || 'Bu ürün için henüz açıklama eklenmemiş.'}
                      </p>
                      
                      {/* Status and Date */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs border ${
                            product.isActive 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : 'bg-red-100 text-red-800 border-red-200'
                          }`}>
                            {product.isActive ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Aktif
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Pasif
                              </>
                            )}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(product.createdAt instanceof Date ? product.createdAt.toISOString() : product.createdAt)}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEdit(product)
                          }}
                          className="h-8 px-3 text-xs border-gray-200 hover:border-blue-300 hover:bg-blue-50 flex-1"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Düzenle
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggleStatus(product)
                          }}
                          className={`h-8 px-3 text-xs border-gray-200 hover:border-green-300 hover:bg-green-50 flex-1 ${
                            product.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'
                          }`}
                        >
                          {product.isActive ? (
                            <>
                              <PowerOff className="h-3 w-3 mr-1" />
                              Pasifleştir
                            </>
                          ) : (
                            <>
                              <Power className="h-3 w-3 mr-1" />
                              Aktifleştir
                            </>
                          )}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDelete(product)
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
                      {/* Product Icon */}
                      <div className={`p-3 ${getCategoryColor(product.category).replace('text-', 'bg-').replace('-800', '-100')} rounded-lg shrink-0`}>
                        <CategoryIcon className={`h-6 w-6 ${getCategoryColor(product.category).split(' ')[1]}`} />
                      </div>
                      
                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                          <Badge className={`text-xs border ${getCategoryColor(product.category)} shrink-0`}>
                            {React.cloneElement(getCategoryIcon(product.category), { className: 'h-3 w-3 mr-1' })}
                            {product.category}
                          </Badge>
                          <Badge className={`text-xs border shrink-0 ${
                            product.isActive 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : 'bg-red-100 text-red-800 border-red-200'
                          }`}>
                            {product.isActive ? 'Aktif' : 'Pasif'}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 truncate">
                          {product.description || 'Açıklama bulunmuyor'}
                        </div>
                      </div>
                      
                      {/* Price */}
                      <div className="text-center bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-100 px-4 py-2 shrink-0">
                        <div className="text-lg font-bold text-green-700">
                          {formatPrice(product.price)}₺
                        </div>
                        <div className="text-xs text-green-600 font-medium">fiyat</div>
                      </div>
                      
                      {/* Date */}
                      <div className="text-center text-sm shrink-0 min-w-[80px]">
                        <div className="text-gray-600 font-medium">{formatDate(product.createdAt instanceof Date ? product.createdAt.toISOString() : product.createdAt)}</div>
                        <div className="text-xs text-gray-500">eklendi</div>
                      </div>
                      
                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onView(product)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Görüntüle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(product)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onToggleStatus(product)}>
                            {product.isActive ? (
                              <>
                                <PowerOff className="mr-2 h-4 w-4" />
                                Pasifleştir
                              </>
                            ) : (
                              <>
                                <Power className="mr-2 h-4 w-4" />
                                Aktifleştir
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDelete(product)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && products.length > 0 && totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Sayfa {currentPage} / {totalPages} ({stats.total} toplam ürün)
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