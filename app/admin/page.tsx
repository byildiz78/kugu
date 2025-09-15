'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { 
  Users, 
  Target, 
  Megaphone, 
  TrendingUp, 
  Activity, 
  Clock, 
  Receipt, 
  DollarSign, 
  CheckCircle, 
  ShoppingBag, 
  TrendingDown, 
  Star, 
  Plus, 
  Minus 
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface DashboardStats {
  totalCustomers: number
  customersThisMonth: number
  customerGrowth: number
  totalCampaigns: number
  activeCampaigns: number
  campaignsEndingToday: number
  totalSegments: number
  segmentsThisMonth: number
  totalTransactions: number
  transactionsThisMonth: number
  transactionGrowth: number
  todayRevenue: number
  thisMonthRevenue: number
  revenueGrowth: number
  // Transaction stats
  completedTransactions: number
  pendingTransactions: number
  averageOrderValue: number
  todayTransactions: number
  // Point transaction stats
  totalPointsEarned: number
  totalPointsSpent: number
  totalPointsExpired: number
  netPointBalance: number
  todayPointsEarned: number
  todayPointsSpent: number
}

interface TopProduct {
  name: string
  quantity: number
  revenue: number
}

interface RevenueByDay {
  date: string
  revenue: number
  orderCount: number
}

interface PointsByMonth {
  month: string
  earned: number
  spent: number
  earnedTL: number
  spentTL: number
}

interface SalesData {
  revenueByDay: RevenueByDay[]
  pointsByMonth: PointsByMonth[]
}

interface RecentActivity {
  id: string
  type: string
  title: string
  description: string
  time: string
  color: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [salesData, setSalesData] = useState<SalesData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/stats')
      if (!response.ok) throw new Error('Failed to fetch dashboard data')
      
      const data = await response.json()
      setStats(data.stats)
      setRecentActivity(data.recentActivity)
      setSalesData(data.salesData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Dashboard verileri yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const statsCards = stats ? [
    // Row 1 - Financial Overview
    {
      title: 'Bugünün Cirosu',
      value: `${stats.todayRevenue.toLocaleString()} ₺`,
      description: `Bu ay toplam ${stats.thisMonthRevenue.toLocaleString()} ₺`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Ortalama Sipariş',
      value: `${stats.averageOrderValue?.toFixed(0) || 0}₺`,
      description: 'İşlem başına',
      icon: ShoppingBag,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Toplam İşlem',
      value: stats.totalTransactions.toLocaleString(),
      description: `${stats.todayTransactions || 0} bugün`,
      icon: Receipt,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Aylık Büyüme',
      value: `${stats.revenueGrowth >= 0 ? '+' : ''}${stats.revenueGrowth}%`,
      description: 'Ciro artışı (geçen aya göre)',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    // Row 2 - Customer & Operations
    {
      title: 'Toplam Müşteri',
      value: stats.totalCustomers.toLocaleString(),
      description: `Bu ay ${stats.customerGrowth >= 0 ? '+' : ''}${stats.customerGrowth}% artış`,
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Bugün Kazandırılan Puan',
      value: (stats.todayPointsEarned || 0).toLocaleString(),
      description: `${((stats.todayPointsEarned || 0) * 0.1).toLocaleString()} ₺ değerinde`,
      icon: Plus,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Bugün Kullanılan Puan',
      value: Math.abs(stats.todayPointsSpent || 0).toLocaleString(),
      description: `${((Math.abs(stats.todayPointsSpent || 0)) * 0.1).toLocaleString()} ₺ değerinde`,
      icon: Minus,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Net Puan Bakiyesi',
      value: (stats.netPointBalance || 0).toLocaleString(),
      description: `${((stats.netPointBalance || 0) * 0.1).toLocaleString()} ₺ değerinde`,
      icon: TrendingUp,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50'
    },
    // Row 3 - Point Statistics
    {
      title: 'Toplam Kazandırılan Puan',
      value: (stats.totalPointsEarned || 0).toLocaleString(),
      description: `${((stats.totalPointsEarned || 0) * 0.1).toLocaleString()} ₺ değerinde`,
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Toplam Kullanılan Puan',
      value: Math.abs(stats.totalPointsSpent || 0).toLocaleString(),
      description: `${((Math.abs(stats.totalPointsSpent || 0)) * 0.1).toLocaleString()} ₺ değerinde`,
      icon: Minus,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ] : []

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Şimdi'
    if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} saat önce`
    return format(date, 'dd MMM yyyy', { locale: tr })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Restoran CRM sisteminizin genel görünümü</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        </div>
      ) : (
        <>
          {/* Stats Cards - 2 rows of 4 cards each */}
          <div className="space-y-6">
            {/* Financial Overview Row */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Finansal Genel Bakış</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsCards.slice(0, 4).map((stat, index) => (
                  <Card key={stat.title} className={`hover:shadow-lg transition-all duration-200 border-l-4 ${
                    index === 0 ? 'border-l-green-500' :
                    index === 1 ? 'border-l-purple-500' :
                    index === 2 ? 'border-l-blue-500' :
                    'border-l-emerald-500'
                  }`}>
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
            </div>

            {/* Operations & Customer Overview Row */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Operasyon & Müşteri Genel Bakış</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsCards.slice(4, 8).map((stat, index) => (
                  <Card key={stat.title} className={`hover:shadow-lg transition-all duration-200 border-l-4 ${
                    index === 0 ? 'border-l-indigo-500' :
                    index === 1 ? 'border-l-amber-500' :
                    index === 2 ? 'border-l-yellow-500' :
                    'border-l-cyan-500'
                  }`}>
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
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Son Aktiviteler
                </CardTitle>
                <CardDescription>
                  Sistemdeki son hareketler
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-3">
                        <div className={`w-2 h-2 ${activity.color} rounded-full`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-gray-500">
                            {activity.description} - {formatTimeAgo(activity.time)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Henüz aktivite bulunmuyor</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Point Movements Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Aylık Puan Hareketleri
                </CardTitle>
                <CardDescription>
                  Son 6 ayda puan kazanım ve kullanım trendi
                </CardDescription>
              </CardHeader>
              <CardContent>
                {salesData?.pointsByMonth && salesData.pointsByMonth.length > 0 ? (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salesData.pointsByMonth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number, name: string) => [
                            value.toLocaleString(),
                            name === 'earned' ? 'Kazanılan' : 
                            name === 'spent' ? 'Harcanan' :
                            name === 'earnedTL' ? 'Kazanılan (₺)' :
                            name === 'spentTL' ? 'Harcanan (₺)' : name
                          ]}
                          labelFormatter={(label) => `${label}`}
                        />
                        <Legend 
                          formatter={(value) => 
                            value === 'earned' ? 'Kazanılan Puan' : 
                            value === 'spent' ? 'Harcanan Puan' :
                            value === 'earnedTL' ? 'Kazanılan (₺)' :
                            value === 'spentTL' ? 'Harcanan (₺)' : value
                          }
                        />
                        <Line 
                          type="monotone" 
                          dataKey="earned" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          dot={{ fill: '#10b981' }}
                          name="earned"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="spent" 
                          stroke="#ef4444" 
                          strokeWidth={2}
                          dot={{ fill: '#ef4444' }}
                          name="spent"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="earnedTL" 
                          stroke="#34d399" 
                          strokeWidth={1}
                          strokeDasharray="5 5"
                          dot={{ fill: '#34d399' }}
                          name="earnedTL"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="spentTL" 
                          stroke="#f87171" 
                          strokeWidth={1}
                          strokeDasharray="5 5"
                          dot={{ fill: '#f87171' }}
                          name="spentTL"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Star className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Henüz puan hareketi verisi bulunmuyor</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}