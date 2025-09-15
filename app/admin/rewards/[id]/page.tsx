'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  ArrowLeft, 
  Gift, 
  Sparkles, 
  Target, 
  Users, 
  TrendingUp, 
  Edit, 
  Trash2,
  UserPlus,
  Calendar,
  Mail,
  Phone
} from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'
import { RewardRules } from '@/components/admin/rewards/reward-rules'

interface Reward {
  id: string
  name: string
  description: string
  pointsCost: number | null
  campaign: { name: string } | null
  customers: Array<{
    id: string
    customerId: string
    isRedeemed: boolean
    redeemedAt: string | null
    expiresAt: string | null
    createdAt: string
    customer: {
      id: string
      name: string
      email: string
      points: number
    }
  }>
  createdAt: string
  updatedAt: string
}

export default function RewardDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [reward, setReward] = useState<Reward | null>(null)
  const [loading, setLoading] = useState(true)
  const [rules, setRules] = useState<any[]>([])
  const [rulesLoading, setRulesLoading] = useState(true)

  useEffect(() => {
    fetchReward()
    fetchRules()
  }, [params.id])

  const fetchReward = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/rewards/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setReward(data)
      } else {
        toast.error('Ödül bulunamadı')
        router.push('/admin/rewards')
      }
    } catch (error) {
      console.error('Error fetching reward:', error)
      toast.error('Ödül yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const fetchRules = async () => {
    try {
      setRulesLoading(true)
      const response = await fetch(`/api/reward-rules?rewardId=${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setRules(data.rules)
      }
    } catch (error) {
      console.error('Error fetching rules:', error)
    } finally {
      setRulesLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!reward || !confirm('Bu ödülü silmek istediğinizden emin misiniz?')) return

    try {
      const response = await fetch(`/api/rewards/${reward.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Ödül başarıyla silindi')
        router.push('/admin/rewards')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Ödül silinirken hata oluştu')
      }
    } catch (error) {
      console.error('Error deleting reward:', error)
      toast.error('Ödül silinirken hata oluştu')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  if (!reward) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Ödül bulunamadı</p>
      </div>
    )
  }

  const totalGiven = reward.customers.length
  const totalRedeemed = reward.customers.filter(c => c.isRedeemed).length
  const redemptionRate = totalGiven > 0 ? Math.round((totalRedeemed / totalGiven) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {reward.pointsCost ? (
                <Sparkles className="h-6 w-6 text-amber-500" />
              ) : (
                <Gift className="h-6 w-6 text-blue-500" />
              )}
              {reward.name}
            </h1>
            <p className="text-gray-600">{reward.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Müşterilere Ver
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Düzenle
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Sil
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Toplam Verilen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-2xl font-bold">{totalGiven}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Kullanılan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold">{totalRedeemed}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Kullanım Oranı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-2xl font-bold">%{redemptionRate}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Puan Maliyeti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span className="text-2xl font-bold">
                {reward.pointsCost || 'Ücretsiz'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reward Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ödül Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="font-medium">Oluşturma Tarihi:</span>
              <p className="text-gray-600">
                {format(new Date(reward.createdAt), 'dd MMMM yyyy HH:mm', { locale: tr })}
              </p>
            </div>
            {reward.campaign && (
              <div>
                <span className="font-medium">Bağlı Kampanya:</span>
                <div className="flex items-center gap-2 mt-1">
                  <Target className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{reward.campaign.name}</span>
                </div>
              </div>
            )}
            <div>
              <span className="font-medium">Puan Maliyeti:</span>
              <p className="text-gray-600">
                {reward.pointsCost ? `${reward.pointsCost} puan` : 'Ücretsiz'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kullanım İstatistikleri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Bekleyen Ödüller:</span>
                <Badge variant="secondary">
                  {totalGiven - totalRedeemed}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Süresi Dolmuş:</span>
                <Badge variant="destructive">
                  {reward.customers.filter(c => 
                    c.expiresAt && new Date(c.expiresAt) < new Date() && !c.isRedeemed
                  ).length}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Bu Ay Kullanılan:</span>
                <Badge variant="default">
                  {reward.customers.filter(c => 
                    c.redeemedAt && 
                    new Date(c.redeemedAt).getMonth() === new Date().getMonth()
                  ).length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reward Rules */}
      {!rulesLoading && reward && (
        <RewardRules 
          rewardId={reward.id}
          rules={rules}
          onRulesChange={fetchRules}
        />
      )}

      {/* Customer Rewards List */}
      <Card>
        <CardHeader>
          <CardTitle>Ödül Geçmişi ({totalGiven})</CardTitle>
          <CardDescription>
            Bu ödülü alan müşteriler ve kullanım durumları
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reward.customers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Bu ödül henüz hiç verilmemiş
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Müşteri</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Verilme Tarihi</TableHead>
                    <TableHead>Kullanım Tarihi</TableHead>
                    <TableHead>Son Kullanma</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reward.customers.map((customerReward) => (
                    <TableRow key={customerReward.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{customerReward.customer.name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {customerReward.customer.email}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                            <Sparkles className="h-3 w-3" />
                            {customerReward.customer.points} puan
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {customerReward.isRedeemed ? (
                          <Badge className="bg-green-100 text-green-800">
                            Kullanıldı
                          </Badge>
                        ) : customerReward.expiresAt && new Date(customerReward.expiresAt) < new Date() ? (
                          <Badge variant="destructive">
                            Süresi Doldu
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Bekliyor
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {format(new Date(customerReward.createdAt), 'dd MMM yyyy', { locale: tr })}
                        </span>
                      </TableCell>
                      <TableCell>
                        {customerReward.redeemedAt ? (
                          <span className="text-sm">
                            {format(new Date(customerReward.redeemedAt), 'dd MMM yyyy', { locale: tr })}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {customerReward.expiresAt ? (
                          <span className="text-sm">
                            {format(new Date(customerReward.expiresAt), 'dd MMM yyyy', { locale: tr })}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">Süresiz</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}