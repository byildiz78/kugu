'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  History, 
  Plus, 
  Minus,
  TrendingUp,
  TrendingDown,
  Clock,
  Gift,
  ShoppingCart,
  Award,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react'
import { PointHistory as PointHistoryModel, PointTransactionType } from '@prisma/client'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

interface PointHistoryWithDetails extends PointHistoryModel {
  customer: {
    name: string
  }
}

interface PointHistoryProps {
  customerId: string
  customerName: string
}

const manualPointSchema = z.object({
  amount: z.number().min(-1000, 'Minimum -1000 puan').max(1000, 'Maksimum 1000 puan'),
  type: z.enum(['EARNED', 'SPENT']),
  source: z.string().min(1, 'Kaynak belirtilmelidir'),
  description: z.string().optional(),
  expiresAt: z.string().optional()
})

type ManualPointFormData = z.infer<typeof manualPointSchema>

const typeLabels = {
  EARNED: 'Kazanılan',
  SPENT: 'Harcanan',
  EXPIRED: 'Süresi Dolmuş'
}

const typeColors = {
  EARNED: 'bg-green-100 text-green-800 border-green-200',
  SPENT: 'bg-red-100 text-red-800 border-red-200',
  EXPIRED: 'bg-gray-100 text-gray-800 border-gray-200'
}

const sourceIcons: Record<string, any> = {
  PURCHASE: ShoppingCart,
  REWARD: Gift,
  BONUS: Award,
  MANUAL: Clock,
  CAMPAIGN: TrendingUp
}

export function PointHistory({ customerId, customerName }: PointHistoryProps) {
  const [pointHistory, setPointHistory] = useState<PointHistoryWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')
  const [manualPointDialog, setManualPointDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<ManualPointFormData>({
    resolver: zodResolver(manualPointSchema),
    defaultValues: {
      type: 'EARNED',
      source: 'MANUAL'
    }
  })

  const watchedType = watch('type')

  const fetchPointHistory = async (page = 1, type = filterType) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        customerId,
        page: page.toString(),
        limit: pagination.limit.toString()
      })
      
      if (type !== 'all') {
        params.append('type', type)
      }

      const response = await fetch(`/api/point-history?${params}`)
      if (!response.ok) throw new Error('Failed to fetch point history')
      
      const data = await response.json()
      setPointHistory(data.pointHistory)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching point history:', error)
      toast.error('Puan geçmişi yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPointHistory()
  }, [customerId, filterType])

  const handleManualPointSubmit = async (data: ManualPointFormData) => {
    try {
      setSubmitting(true)
      const response = await fetch('/api/point-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          customerId,
          amount: data.type === 'SPENT' ? -Math.abs(data.amount) : Math.abs(data.amount)
        })
      })

      if (!response.ok) throw new Error('Failed to add manual point')

      toast.success(`${Math.abs(data.amount)} puan başarıyla ${data.type === 'EARNED' ? 'eklendi' : 'düşüldü'}`)
      setManualPointDialog(false)
      reset()
      fetchPointHistory()
    } catch (error) {
      console.error('Error adding manual point:', error)
      toast.error('Puan eklenirken hata oluştu')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSourceIcon = (source: string) => {
    const IconComponent = sourceIcons[source] || Clock
    return IconComponent
  }

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      PURCHASE: 'Alışveriş',
      REWARD: 'Ödül',
      BONUS: 'Bonus',
      MANUAL: 'Manuel',
      CAMPAIGN: 'Kampanya'
    }
    return labels[source] || source
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Puan Geçmişi
            </CardTitle>
            <CardDescription>
              {customerName} için puan kazanma ve harcama geçmişi
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="EARNED">Kazanılan</SelectItem>
                <SelectItem value="SPENT">Harcanan</SelectItem>
                <SelectItem value="EXPIRED">Süresi Dolmuş</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPointHistory()}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Yenile
            </Button>
            <Button 
              onClick={() => setManualPointDialog(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Manuel Puan
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : pointHistory.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Henüz puan geçmişi bulunmuyor</p>
            <p className="text-sm text-gray-400">
              İlk alışveriş veya manuel puan girişi yapıldığında buraya görünecek
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pointHistory.map((entry) => {
              const SourceIcon = getSourceIcon(entry.source)
              const isPositive = entry.amount > 0
              
              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  {/* Icon */}
                  <div className={`p-2 rounded-lg ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
                    <SourceIcon className={`h-5 w-5 ${isPositive ? 'text-green-600' : 'text-red-600'}`} />
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`text-xs border ${typeColors[entry.type as keyof typeof typeColors]}`}>
                        {typeLabels[entry.type as keyof typeof typeLabels]}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {getSourceLabel(entry.source)}
                      </span>
                    </div>
                    {entry.description && (
                      <p className="text-sm text-gray-600 mb-1">{entry.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(entry.createdAt.toString())}
                      </span>
                      {entry.expiresAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Son: {formatDate(entry.expiresAt.toString())}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <div className={`text-lg font-semibold flex items-center gap-1 ${
                      isPositive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isPositive ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                      {Math.abs(entry.amount)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Bakiye: {entry.balance}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Toplam {pagination.total} kayıt, {pagination.pages} sayfa
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchPointHistory(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    Önceki
                  </Button>
                  <span className="text-sm">
                    {pagination.page} / {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchPointHistory(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                  >
                    Sonraki
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Manual Point Dialog */}
      <Dialog open={manualPointDialog} onOpenChange={setManualPointDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manuel Puan Girişi</DialogTitle>
            <DialogDescription>
              {customerName} için manuel puan ekle veya düş
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleManualPointSubmit)} className="space-y-4">
            {/* Type */}
            <div className="space-y-2">
              <Label>İşlem Türü</Label>
              <Select
                value={watchedType}
                onValueChange={(value) => setValue('type', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EARNED">Puan Ekle</SelectItem>
                  <SelectItem value="SPENT">Puan Düş</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label>Puan Miktarı</Label>
              <Input
                type="number"
                {...register('amount', { valueAsNumber: true })}
                placeholder="Örn: 100"
              />
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount.message}</p>
              )}
            </div>

            {/* Source */}
            <div className="space-y-2">
              <Label>Kaynak</Label>
              <Select
                value={watch('source')}
                onValueChange={(value) => setValue('source', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANUAL">Manuel</SelectItem>
                  <SelectItem value="BONUS">Bonus</SelectItem>
                  <SelectItem value="CAMPAIGN">Kampanya</SelectItem>
                  <SelectItem value="REWARD">Ödül</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Açıklama (Opsiyonel)</Label>
              <Input
                {...register('description')}
                placeholder="İşlem açıklaması"
              />
            </div>

            {/* Expires At */}
            {watchedType === 'EARNED' && (
              <div className="space-y-2">
                <Label>Son Kullanma Tarihi (Opsiyonel)</Label>
                <Input
                  type="datetime-local"
                  {...register('expiresAt')}
                />
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setManualPointDialog(false)}
                disabled={submitting}
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    İşleniyor...
                  </div>
                ) : (
                  `Puan ${watchedType === 'EARNED' ? 'Ekle' : 'Düş'}`
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}