'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Gift, Users, TrendingUp, Search, Sparkles, Award, Target } from 'lucide-react'
import { toast } from 'sonner'

interface Reward {
  id: string
  name: string
  description: string
  pointsCost: number | null
  campaign: { name: string } | null
  _count: { customers: number }
  stats: {
    totalGiven: number
    totalRedeemed: number
    redemptionRate: number
  }
  createdAt: string
  updatedAt: string
}

interface RewardStats {
  total: number
  active: number
  totalGiven: number
  averageRedemption: number
}

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [stats, setStats] = useState<RewardStats>({
    total: 0,
    active: 0,
    totalGiven: 0,
    averageRedemption: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const fetchRewards = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchValue && { search: searchValue })
      })

      const response = await fetch(`/api/rewards?${params}`)
      if (!response.ok) throw new Error('Failed to fetch rewards')
      
      const data = await response.json()
      setRewards(data.rewards)
      
      // Calculate stats
      const totalGiven = data.rewards.reduce((sum: number, r: Reward) => sum + r.stats.totalGiven, 0)
      const totalRedeemed = data.rewards.reduce((sum: number, r: Reward) => sum + r.stats.totalRedeemed, 0)
      const avgRedemption = totalGiven > 0 ? Math.round((totalRedeemed / totalGiven) * 100) : 0
      
      setStats({
        total: data.pagination.total,
        active: data.rewards.filter((r: Reward) => r.pointsCost !== null || r.campaign).length,
        totalGiven,
        averageRedemption: avgRedemption
      })
    } catch (error) {
      console.error('Error fetching rewards:', error)
      toast.error('Ödüller yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRewards()
  }, [currentPage, searchValue])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchRewards()
  }

  const statsCards = [
    {
      title: 'Toplam Ödül',
      value: stats.total.toString(),
      description: `${stats.active} aktif ödül`,
      icon: Gift,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Verilen Ödül',
      value: stats.totalGiven.toString(),
      description: 'Toplam dağıtılan',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Kullanım Oranı',
      value: `%${stats.averageRedemption}`,
      description: 'Ortalama kullanım',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Puan Ödülleri',
      value: rewards.filter(r => r.pointsCost && r.pointsCost > 0).length.toString(),
      description: 'Puan karşılığı',
      icon: Award,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ödül Yönetimi</h1>
          <p className="text-gray-600">Müşterilerinize özel ödüller ve hediyeler tanımlayın</p>
        </div>
        <Button onClick={() => window.location.href = '/admin/rewards/new'}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Ödül
        </Button>
      </div>

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

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Ödül adı veya açıklama ile ara..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Ara</Button>
          </form>
        </CardContent>
      </Card>

      {/* Rewards List */}
      <Card>
        <CardHeader>
          <CardTitle>Ödül Listesi</CardTitle>
          <CardDescription>
            Tanımlı ödülleri görüntüleyin ve yönetin
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          ) : rewards.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">Henüz ödül tanımlanmamış</p>
              <Button onClick={() => window.location.href = '/admin/rewards/new'}>
                <Plus className="mr-2 h-4 w-4" />
                İlk Ödülü Oluştur
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewards.map((reward) => (
                <Card 
                  key={reward.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => window.location.href = `/admin/rewards/${reward.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {reward.pointsCost ? (
                            <Sparkles className="h-5 w-5 text-amber-500" />
                          ) : (
                            <Gift className="h-5 w-5 text-blue-500" />
                          )}
                          {reward.name}
                        </CardTitle>
                        {reward.campaign && (
                          <div className="flex items-center gap-1 mt-1">
                            <Target className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {reward.campaign.name}
                            </span>
                          </div>
                        )}
                      </div>
                      {reward.pointsCost && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-amber-600">
                            {reward.pointsCost}
                          </div>
                          <div className="text-xs text-gray-500">puan</div>
                        </div>
                      )}
                    </div>
                    <CardDescription className="mt-2">
                      {reward.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-semibold">{reward.stats.totalGiven}</div>
                        <div className="text-xs text-gray-500">Verildi</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-semibold">{reward.stats.totalRedeemed}</div>
                        <div className="text-xs text-gray-500">Kullanıldı</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-semibold">%{reward.stats.redemptionRate}</div>
                        <div className="text-xs text-gray-500">Oran</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}