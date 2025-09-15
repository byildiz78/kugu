'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CampaignTable } from './campaign-table'
import { Megaphone, TrendingUp, Users, BarChart3, Search, Filter, Plus } from 'lucide-react'
import { Campaign } from '@prisma/client'

interface CampaignWithDetails extends Campaign {
  restaurant: { name: string }
  segments: { name: string }[]
  _count: { 
    usages?: number
    transactions?: number 
  }
}

interface CampaignStats {
  total: number
  active: number
  totalUsages: number
  averageUsage: number
}

interface CampaignListProps {
  campaigns: CampaignWithDetails[]
  stats: CampaignStats
  loading: boolean
  onEdit: (campaign: CampaignWithDetails) => void
  onDelete: (campaign: CampaignWithDetails) => void
  onView: (campaign: CampaignWithDetails) => void
  onToggleStatus: (campaign: CampaignWithDetails) => void
  // Search and filter props
  searchValue: string
  setSearchValue: (value: string) => void
  typeFilter: string
  setTypeFilter: (value: string) => void
  statusFilter: string
  setStatusFilter: (value: string) => void
  currentPage: number
  setCurrentPage: (page: number) => void
  handleSearch: (e: React.FormEvent) => void
}

export function CampaignList({
  campaigns,
  stats,
  loading,
  onEdit,
  onDelete,
  onView,
  onToggleStatus,
  searchValue,
  setSearchValue,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
  currentPage,
  setCurrentPage,
  handleSearch
}: CampaignListProps) {
  const statsCards = [
    {
      title: 'Toplam Kampanya',
      value: stats.total.toString(),
      description: `${stats.active} aktif kampanya`,
      icon: Megaphone,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Aktif Kampanya',
      value: stats.active.toString(),
      description: 'Şu anda çalışan',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Toplam Kullanım',
      value: stats.totalUsages.toString(),
      description: 'Tüm kampanyalar',
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Ortalama Kullanım',
      value: stats.averageUsage.toString(),
      description: 'Kampanya başına',
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

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Kampanya adı veya açıklama ile ara..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Tür filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tüm Türler</SelectItem>
                <SelectItem value="DISCOUNT">İndirim</SelectItem>
                <SelectItem value="PRODUCT_BASED">Ürün Bazlı</SelectItem>
                <SelectItem value="CATEGORY_DISCOUNT">Kategori İndirimi</SelectItem>
                <SelectItem value="BUY_X_GET_Y">X Al Y Bedava</SelectItem>
                <SelectItem value="COMBO_DEAL">Kombo Fırsat</SelectItem>
                <SelectItem value="REWARD_CAMPAIGN">Ödül Kampanyası</SelectItem>
                <SelectItem value="LOYALTY_POINTS">Sadakat Puanı</SelectItem>
                <SelectItem value="TIME_BASED">Zaman Bazlı</SelectItem>
                <SelectItem value="BIRTHDAY_SPECIAL">Doğum Günü</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tümü</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Pasif</SelectItem>
              </SelectContent>
            </Select>

            <Button type="submit">Ara</Button>
          </form>
        </CardContent>
      </Card>

      {/* Campaign Table */}
      <Card>
        <CardHeader>
          <CardTitle>Kampanya Listesi</CardTitle>
          <CardDescription>
            Tüm kampanyalarınızı görüntüleyin ve yönetin
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          ) : (
            <CampaignTable
              campaigns={campaigns}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
              onToggleStatus={onToggleStatus}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}