'use client'

import React, { useState, useEffect } from 'react'
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
  Zap,
  Clock,
  CheckCircle
} from 'lucide-react'
import { Segment } from '@prisma/client'
import { toast } from 'sonner'

interface SegmentWithDetails extends Segment {
  restaurant: { name: string }
  _count: { customers: number }
}

interface SegmentStats {
  total: number
  automatic: number
  manual: number
  totalCustomers: number
  averageSize: number
}

interface EnhancedSegmentsViewProps {
  segments: SegmentWithDetails[]
  stats: SegmentStats
  loading: boolean
  onEdit: (segment: SegmentWithDetails) => void
  onDelete: (segment: SegmentWithDetails) => void
  onView: (segment: SegmentWithDetails) => void
  onManageCustomers: (segment: SegmentWithDetails) => void
  onRefresh: (segment: SegmentWithDetails) => void
  onRefreshAll: () => void
  searchValue: string
  onSearchChange: (value: string) => void
}

export function EnhancedSegmentsView({
  segments,
  stats,
  loading,
  onEdit,
  onDelete,
  onView,
  onManageCustomers,
  onRefresh,
  onRefreshAll,
  searchValue,
  onSearchChange
}: EnhancedSegmentsViewProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [filterType, setFilterType] = useState<'all' | 'automatic' | 'manual'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'customers' | 'created'>('name')

  const filteredSegments = segments.filter(segment => {
    if (filterType === 'automatic' && !segment.isAutomatic) return false
    if (filterType === 'manual' && segment.isAutomatic) return false
    return true
  }).sort((a, b) => {
    switch (sortBy) {
      case 'customers':
        return b._count.customers - a._count.customers
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      default:
        return a.name.localeCompare(b.name)
    }
  })

  const getSegmentIcon = (segment: SegmentWithDetails) => {
    if (segment.isAutomatic) return <Zap className="h-5 w-5 text-amber-500" />
    return <Users className="h-5 w-5 text-blue-500" />
  }

  const getSegmentColor = (segment: SegmentWithDetails) => {
    if (segment.isAutomatic) return 'border-amber-200 bg-amber-50'
    return 'border-blue-200 bg-blue-50'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const statsCards = [
    {
      title: 'Toplam Segment',
      value: stats.total.toString(),
      description: `${stats.automatic} otomatik, ${stats.manual} manuel`,
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Toplam Müşteri',
      value: stats.totalCustomers.toString(),
      description: 'Segmentlerdeki müşteriler',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Ortalama Büyüklük',
      value: Math.round(stats.averageSize).toString(),
      description: 'Segment başına müşteri',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Otomatik Segmentler',
      value: stats.automatic.toString(),
      description: 'Dinamik güncellenen',
      icon: Zap,
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
              <CardTitle className="text-lg">Müşteri Segmentleri</CardTitle>
              <CardDescription>
                Müşterilerinizi gruplandırın ve hedefli kampanyalar oluşturun
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRefreshAll}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Tümünü Yenile
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Segment adı ile ara..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="automatic">Otomatik</SelectItem>
                  <SelectItem value="manual">Manuel</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">İsme Göre</SelectItem>
                  <SelectItem value="customers">Müşteri Sayısı</SelectItem>
                  <SelectItem value="created">Oluşturma Tarihi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {filteredSegments.length} segment gösteriliyor
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

      {/* Segments Display */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        </div>
      ) : filteredSegments.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Target className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">
                {searchValue ? 'Arama kriterinize uygun segment bulunamadı' : 'Henüz segment oluşturulmamış'}
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
          {filteredSegments.map((segment) => (
            <Card 
              key={segment.id} 
              className={`hover:shadow-lg transition-all ${viewMode === 'grid' ? 'cursor-pointer' : ''} border-2 ${getSegmentColor(segment)}`}
              onClick={viewMode === 'grid' ? () => onView(segment) : undefined}
            >
              {viewMode === 'grid' ? (
                <CardContent className="p-0">
                  {/* Header with colored background */}
                  <div className={`p-4 ${segment.isAutomatic ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`}>
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                          {React.cloneElement(getSegmentIcon(segment), { className: 'h-5 w-5 text-white' })}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-white">{segment.name}</h3>
                          <div className="text-xs text-white/80 flex items-center gap-1">
                            {segment.isAutomatic ? '⚡ Otomatik Segment' : '👤 Manuel Segment'}
                          </div>
                        </div>
                      </div>
                      {/* Customer Count */}
                      <div className="text-center bg-white/20 rounded-lg px-3 py-2 backdrop-blur-sm">
                        <div className="text-2xl font-bold text-white">
                          {segment._count.customers}
                        </div>
                        <div className="text-xs text-white/80">müşteri</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-4 space-y-3">
                    {/* Description */}
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                      {segment.description || 'Bu segment için henüz açıklama eklenmemiş.'}
                    </p>
                    
                    {/* Date */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 border-t pt-3">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(segment.createdAt instanceof Date ? segment.createdAt.toISOString() : segment.createdAt)} tarihinde oluşturuldu</span>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(segment)
                        }}
                        className="h-8 px-3 text-xs border-gray-200 hover:border-green-300 hover:bg-green-50 flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Düzenle
                      </Button>
                      
                      {!segment.isAutomatic ? (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onManageCustomers(segment)
                          }}
                          className="h-8 px-3 text-xs bg-purple-600 hover:bg-purple-700 text-white flex-1"
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Müşteri
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRefresh(segment)
                          }}
                          className="h-8 px-3 text-xs text-amber-600 border-amber-200 hover:bg-amber-50 flex-1"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Yenile
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(segment)
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
                    {/* Icon */}
                    <div className={`p-2 rounded-lg shrink-0 ${segment.isAutomatic ? 'bg-amber-100' : 'bg-blue-100'}`}>
                      {React.cloneElement(getSegmentIcon(segment), { className: 'h-5 w-5' })}
                    </div>
                    
                    {/* Segment Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{segment.name}</h3>
                        <Badge 
                          variant={segment.isAutomatic ? "default" : "secondary"}
                          className={`text-xs shrink-0 ${segment.isAutomatic ? 'bg-amber-500' : 'bg-blue-500'} text-white`}
                        >
                          {segment.isAutomatic ? '⚡' : '👤'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {segment.description || 'Açıklama bulunmamaktadır.'}
                      </p>
                    </div>
                    
                    {/* Customer Count */}
                    <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100 px-4 py-2 shrink-0">
                      <div className="text-xl font-bold text-blue-700">
                        {segment._count.customers}
                      </div>
                      <div className="text-xs text-blue-600 font-medium">müşteri</div>
                    </div>
                    
                    {/* Date */}
                    <div className="text-center text-sm shrink-0 min-w-[80px]">
                      <div className="text-gray-600 font-medium">{formatDate(segment.createdAt instanceof Date ? segment.createdAt.toISOString() : segment.createdAt)}</div>
                      <div className="text-xs text-gray-500">oluşturuldu</div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onView(segment)
                        }}
                        className="h-8 px-2 text-xs hover:bg-blue-50"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(segment)
                        }}
                        className="h-8 px-2 text-xs hover:bg-green-50"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      {!segment.isAutomatic ? (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onManageCustomers(segment)
                          }}
                          className="h-8 px-3 text-xs bg-purple-600 hover:bg-purple-700 text-white font-medium"
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Müşteri
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRefresh(segment)
                          }}
                          className="h-8 px-2 text-xs text-amber-600 hover:bg-amber-50"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(segment)
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
    </div>
  )
}