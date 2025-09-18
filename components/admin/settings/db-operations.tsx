'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Database,
  Trash2,
  AlertTriangle,
  Users,
  TrendingUp,
  Award,
  Shield,
  Info,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface OperationStats {
  customers?: number
  pointHistory?: number
  campaignUsage?: number
}

export function DbOperations() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<string | null>(null)
  const [stats, setStats] = useState<OperationStats>({})

  // Superadmin kontrolü
  const isSuperAdmin = session?.user?.email === 'superadmin@aircrm.com' ||
                       session?.user?.role === 'ADMIN'

  const operations = [
    {
      id: 'delete-customers',
      title: 'Müşterileri Sil',
      description: 'Tüm müşteri kayıtlarını ve ilişkili verileri siler',
      icon: Users,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      action: 'customers',
      warning: 'Bu işlem tüm müşteri verilerini, işlem geçmişlerini, puan hareketlerini ve kampanya kullanımlarını silecektir.',
      stats: `${stats.customers || 0} müşteri kaydı`
    },
    {
      id: 'delete-points',
      title: 'Puan Hareketlerini Sil',
      description: 'Tüm puan hareket geçmişini temizler',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      action: 'points',
      warning: 'Bu işlem tüm puan kazanım ve harcama geçmişini silecektir. Müşterilerin mevcut puan bakiyesi etkilenmeyecektir.',
      stats: `${stats.pointHistory || 0} puan hareketi`
    },
    {
      id: 'delete-campaigns',
      title: 'Kampanya Kullanımlarını Sil',
      description: 'Tüm kampanya kullanım geçmişini temizler',
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      action: 'campaigns',
      warning: 'Bu işlem tüm kampanya kullanım geçmişini silecektir. Kampanya tanımları silinmeyecektir.',
      stats: `${stats.campaignUsage || 0} kullanım kaydı`
    }
  ]

  React.useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/db-stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleDelete = async (action: string) => {
    setIsLoading(action)
    setConfirmDialog(null)

    try {
      const response = await fetch(`/api/admin/db-operations/${action}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || 'İşlem başarıyla tamamlandı', {
          description: `${data.deletedCount || 0} kayıt silindi`
        })

        // Stats'ı güncelle
        await fetchStats()
      } else {
        toast.error('İşlem başarısız', {
          description: data.error || 'Bir hata oluştu'
        })
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Bağlantı hatası', {
        description: 'İşlem gerçekleştirilemedi'
      })
    } finally {
      setIsLoading(null)
    }
  }

  if (!isSuperAdmin) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gray-100 rounded-lg">
              <Shield className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <CardTitle>Yetkisiz Erişim</CardTitle>
              <CardDescription>
                Bu bölüme sadece süper yöneticiler erişebilir
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg">
              <Database className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle>Veritabanı İşlemleri</CardTitle>
              <CardDescription>
                Kritik veritabanı temizleme ve bakım işlemleri
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Dikkat!</AlertTitle>
            <AlertDescription>
              Bu bölümdeki işlemler geri alınamaz. Lütfen işlem yapmadan önce veritabanı yedeği aldığınızdan emin olun.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {operations.map((operation) => (
              <Card key={operation.id} className="border-2">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${operation.bgColor}`}>
                      <operation.icon className={`h-5 w-5 ${operation.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {operation.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {operation.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Info className="h-4 w-4" />
                      <span>{operation.stats}</span>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setConfirmDialog(operation.action)}
                    disabled={isLoading !== null}
                  >
                    {isLoading === operation.action ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        İşleniyor...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Sil
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Confirm Dialog */}
          {confirmDialog && (
            <Dialog open={true} onOpenChange={() => setConfirmDialog(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    Onay Gerekiyor
                  </DialogTitle>
                  <DialogDescription className="pt-4">
                    <Alert className="mb-4" variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Bu işlem geri alınamaz!</AlertTitle>
                      <AlertDescription>
                        {operations.find(op => op.action === confirmDialog)?.warning}
                      </AlertDescription>
                    </Alert>
                    <p className="text-gray-700">
                      Bu işlemi gerçekleştirmek istediğinizden emin misiniz?
                    </p>
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setConfirmDialog(null)}
                  >
                    İptal
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(confirmDialog)}
                  >
                    Evet, Sil
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <Info className="h-5 w-5" />
            Bilgi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Müşteri silme işlemi: İşlem geçmişi, puan hareketleri, kampanya kullanımları, ödüller ve segment üyelikleri de silinir.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Puan hareketleri silme: Sadece geçmiş kayıtlar silinir, müşterilerin mevcut puan bakiyesi korunur.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Kampanya kullanımları silme: Kullanım geçmişi temizlenir, kampanya tanımları ve ayarları korunur.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600 mt-1">⚠</span>
              <span className="font-semibold">İşlem öncesi mutlaka veritabanı yedeği alınmalıdır.</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}