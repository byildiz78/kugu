'use client'

import { useState } from 'react'
import { Campaign } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit, Trash2, Eye, Play, Pause, BarChart3, Calendar, Target, Gift, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'

interface CampaignWithDetails extends Campaign {
  restaurant: { name: string }
  segments: { name: string }[]
  _count: { 
    usages?: number
    transactions?: number 
  }
}

interface CampaignTableProps {
  campaigns: CampaignWithDetails[]
  onEdit: (campaign: CampaignWithDetails) => void
  onDelete: (campaign: CampaignWithDetails) => void
  onView: (campaign: CampaignWithDetails) => void
  onToggleStatus: (campaign: CampaignWithDetails) => void
}

const campaignTypeLabels = {
  DISCOUNT: 'İndirim',
  PRODUCT_BASED: 'Ürün Bazlı',
  LOYALTY_POINTS: 'Sadakat Puanı',
  TIME_BASED: 'Zaman Bazlı',
  BIRTHDAY_SPECIAL: 'Doğum Günü',
  COMBO_DEAL: 'Combo'
}

const discountTypeLabels = {
  PERCENTAGE: '%',
  FIXED_AMOUNT: '₺',
  FREE_ITEM: 'Ücretsiz',
  BUY_ONE_GET_ONE: '2 Al 1 Öde'
}

export function CampaignTable({ 
  campaigns, 
  onEdit, 
  onDelete, 
  onView, 
  onToggleStatus 
}: CampaignTableProps) {
  const getCampaignStatus = (campaign: CampaignWithDetails) => {
    const now = new Date()
    const start = new Date(campaign.startDate)
    const end = new Date(campaign.endDate)

    if (!campaign.isActive) {
      return { status: 'inactive', label: 'Pasif', color: 'bg-gray-100 text-gray-800' }
    }
    
    if (now < start) {
      return { status: 'scheduled', label: 'Planlandı', color: 'bg-blue-100 text-blue-800' }
    }
    
    if (now > end) {
      return { status: 'expired', label: 'Süresi Doldu', color: 'bg-red-100 text-red-800' }
    }
    
    return { status: 'active', label: 'Aktif', color: 'bg-green-100 text-green-800' }
  }

  const formatDiscountValue = (campaign: CampaignWithDetails) => {
    const symbol = discountTypeLabels[campaign.discountType as keyof typeof discountTypeLabels]
    if (campaign.discountType === 'PERCENTAGE') {
      return `${campaign.discountValue}${symbol}`
    }
    if (campaign.discountType === 'FIXED_AMOUNT') {
      return `${campaign.discountValue}${symbol}`
    }
    return symbol
  }

  const getUsagePercentage = (campaign: CampaignWithDetails) => {
    const totalUsage = (campaign._count.usages || 0) + (campaign._count.transactions || 0)
    return campaign.maxUsage ? (totalUsage / campaign.maxUsage) * 100 : 0
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DISCOUNT': return { icon: <Gift className="h-4 w-4" />, gradient: 'from-emerald-400 to-teal-500', glow: 'shadow-emerald-200' }
      case 'PRODUCT_BASED': return { icon: <Target className="h-4 w-4" />, gradient: 'from-blue-400 to-indigo-500', glow: 'shadow-blue-200' }
      case 'LOYALTY_POINTS': return { icon: <TrendingUp className="h-4 w-4" />, gradient: 'from-purple-400 to-pink-500', glow: 'shadow-purple-200' }
      case 'TIME_BASED': return { icon: <Calendar className="h-4 w-4" />, gradient: 'from-orange-400 to-red-500', glow: 'shadow-orange-200' }
      case 'BIRTHDAY_SPECIAL': return { icon: <Gift className="h-4 w-4" />, gradient: 'from-pink-400 to-rose-500', glow: 'shadow-pink-200' }
      case 'COMBO_DEAL': return { icon: <Target className="h-4 w-4" />, gradient: 'from-cyan-400 to-blue-500', glow: 'shadow-cyan-200' }
      default: return { icon: <Gift className="h-4 w-4" />, gradient: 'from-gray-400 to-gray-500', glow: 'shadow-gray-200' }
    }
  }

  return (
    <div className="space-y-3">
      {campaigns.map((campaign) => {
        const status = getCampaignStatus(campaign)
        const usagePercentage = getUsagePercentage(campaign)
        const totalUsage = (campaign._count.usages || 0) + (campaign._count.transactions || 0)
        const typeInfo = getTypeIcon(campaign.type)
        
        return (
          <Card key={campaign.id} className="relative overflow-hidden hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-blue-500 group">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                {/* Sol taraf - Kompakt bilgiler */}
                <div className="flex items-center space-x-3 flex-1">
                  {/* Animasyonlu ikon */}
                  <div className={`relative p-2.5 rounded-xl bg-gradient-to-br ${typeInfo.gradient} text-white shadow-lg ${typeInfo.glow} group-hover:scale-110 transition-transform duration-300`}>
                    {typeInfo.icon}
                    <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  
                  {/* Ana bilgiler */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{campaign.name}</h3>
                      <Badge className={`${status.color} shadow-sm`}>
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 truncate mb-2">{campaign.description}</p>
                    
                    {/* Kompakt detaylar */}
                    <div className="flex items-center space-x-4 text-xs">
                      {/* Tür */}
                      <div className="flex items-center space-x-1">
                        <Badge variant="outline" className="text-xs px-2 py-0.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700">
                          {campaignTypeLabels[campaign.type as keyof typeof campaignTypeLabels]}
                        </Badge>
                      </div>
                      
                      {/* İndirim */}
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-400">İndirim:</span>
                        <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                          {formatDiscountValue(campaign)}
                        </span>
                      </div>
                      
                      {/* Tarih */}
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-600">
                          {(() => {
                            try {
                              return `${format(new Date(campaign.startDate), 'dd MMM')} - ${format(new Date(campaign.endDate), 'dd MMM')}`
                            } catch {
                              return 'Tarih yüklenemedi'
                            }
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Sağ taraf - İstatistikler ve aksiyonlar */}
                <div className="flex items-center space-x-6">
                  {/* Kullanım istatistikleri */}
                  <div className="text-center">
                    <div className="flex items-center space-x-1 mb-1">
                      <BarChart3 className="h-4 w-4 text-purple-500" />
                      <span className="font-bold text-lg text-purple-600">{totalUsage}</span>
                      {campaign.maxUsage && (
                        <span className="text-sm text-gray-400">/{campaign.maxUsage}</span>
                      )}
                    </div>
                    {campaign.maxUsage && (
                      <Progress 
                        value={usagePercentage} 
                        className="w-16 h-1.5 bg-purple-100"
                      />
                    )}
                    <div className="text-xs text-gray-500 mt-1">kullanım</div>
                  </div>
                  
                  {/* Segmentler */}
                  <div className="max-w-32">
                    <div className="flex flex-wrap gap-1 mb-1">
                      {campaign.segments.length > 0 ? (
                        campaign.segments.slice(0, 2).map((segment, index) => (
                          <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-700">
                            {segment.name}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 text-gray-700">
                          Tüm Müşteriler
                        </Badge>
                      )}
                      {campaign.segments.length > 2 && (
                        <Badge variant="secondary" className="text-xs px-1 py-0.5 bg-gray-100 text-gray-600">
                          +{campaign.segments.length - 2}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">hedef kitle</div>
                  </div>
                  
                  {/* Aksiyonlar */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="z-[9999] shadow-xl">
                      <DropdownMenuItem onClick={() => onView(campaign)} className="hover:bg-blue-50">
                        <Eye className="mr-2 h-4 w-4" />
                        Detaylar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(campaign)} className="hover:bg-green-50">
                        <Edit className="mr-2 h-4 w-4" />
                        Düzenle
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onToggleStatus(campaign)} className="hover:bg-yellow-50">
                        {campaign.isActive ? (
                          <>
                            <Pause className="mr-2 h-4 w-4" />
                            Duraklat
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Aktifleştir
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(campaign)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {campaigns.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Gift className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz kampanya yok</h3>
            <p className="text-gray-500">İlk kampanyanızı oluşturun ve müşterilerinizi memnun edin.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}