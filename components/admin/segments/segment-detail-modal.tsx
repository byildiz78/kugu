'use client'

import { useState, useEffect } from 'react'
import { Segment, Customer, CustomerLevel } from '@prisma/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Target, Users, Calendar, Zap, Mail, Phone, CreditCard, TrendingUp, X } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface SegmentWithDetails extends Segment {
  restaurant: { name: string }
  _count: { customers: number }
}

interface CustomerWithDetails extends Customer {
  _count: { transactions: number }
}

interface SegmentDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  segment: SegmentWithDetails | null
}

const levelLabels = {
  REGULAR: 'Normal',
  BRONZE: 'Bronz',
  SILVER: 'Gümüş',
  GOLD: 'Altın',
  PLATINUM: 'Platin'
}

const levelColors = {
  REGULAR: 'bg-gray-100 text-gray-800',
  BRONZE: 'bg-amber-100 text-amber-800',
  SILVER: 'bg-slate-100 text-slate-800',
  GOLD: 'bg-yellow-100 text-yellow-800',
  PLATINUM: 'bg-purple-100 text-purple-800'
}

export function SegmentDetailModal({ open, onOpenChange, segment }: SegmentDetailModalProps) {
  const [customers, setCustomers] = useState<CustomerWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithDetails | null>(null)

  useEffect(() => {
    if (open && segment) {
      fetchSegmentCustomers()
    }
  }, [open, segment])

  const fetchSegmentCustomers = async () => {
    if (!segment) return

    try {
      setLoading(true)
      const response = await fetch(`/api/segments/${segment.id}/customers`)
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers || [])
      }
    } catch (error) {
      console.error('Error fetching segment customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeCustomer = async (customerId: string) => {
    if (!segment || !confirm('Bu müşteriyi segmentten çıkarmak istediğinizden emin misiniz?')) return

    try {
      const response = await fetch(`/api/segments/${segment.id}/customers?customerId=${customerId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setCustomers(customers.filter(c => c.id !== customerId))
      }
    } catch (error) {
      console.error('Error removing customer:', error)
    }
  }

  if (!segment) return null

  const totalSpent = customers.reduce((sum, customer) => sum + (customer.points * 10), 0) // Approximate

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-amber-600" />
            {segment.name}
          </DialogTitle>
          <DialogDescription className="text-base">
            {segment.description || 'Segment detayları ve müşteri listesi'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Müşteri Sayısı</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-amber-600" />
                    <span className="text-2xl font-bold">{customers.length}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Segment Tipi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {segment.isAutomatic ? (
                      <>
                        <Zap className="h-4 w-4 text-amber-600" />
                        <span className="text-lg font-semibold">Otomatik</span>
                      </>
                    ) : (
                      <>
                        <Users className="h-4 w-4 text-gray-600" />
                        <span className="text-lg font-semibold">Manuel</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Ortalama Puan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-amber-600" />
                    <span className="text-2xl font-bold">
                      {customers.length > 0 
                        ? Math.round(customers.reduce((sum, c) => sum + c.points, 0) / customers.length)
                        : 0
                      }
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Oluşturma Tarihi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber-600" />
                    <span className="text-sm">
                      {format(new Date(segment.createdAt), 'dd MMM yyyy', { locale: tr })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Criteria Info */}
            {segment.isAutomatic && segment.criteria && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Otomatik Segment Kriterleri</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {(() => {
                      try {
                        const criteria = JSON.parse(segment.criteria)
                        return (
                          <>
                            {criteria.period && (
                              <div>
                                <span className="font-medium">Analiz Dönemi:</span>{' '}
                                {criteria.period === 'last_30_days' && 'Son 30 Gün'}
                                {criteria.period === 'last_90_days' && 'Son 90 Gün'}
                                {criteria.period === 'last_180_days' && 'Son 180 Gün'}
                                {criteria.period === 'last_year' && 'Son 1 Yıl'}
                                {criteria.period === 'all_time' && 'Tüm Zamanlar'}
                              </div>
                            )}
                            {criteria.totalSpent && (
                              <div>
                                <span className="font-medium">Toplam Harcama:</span>{' '}
                                {criteria.totalSpent.min && `Min: ${criteria.totalSpent.min}₺`}
                                {criteria.totalSpent.max && ` Max: ${criteria.totalSpent.max}₺`}
                              </div>
                            )}
                            {criteria.purchaseCount && (
                              <div>
                                <span className="font-medium">Alışveriş Sayısı:</span>{' '}
                                {criteria.purchaseCount.min && `Min: ${criteria.purchaseCount.min}`}
                                {criteria.purchaseCount.max && ` Max: ${criteria.purchaseCount.max}`}
                              </div>
                            )}
                            {criteria.averageOrderValue && (
                              <div>
                                <span className="font-medium">Ortalama Sepet:</span>{' '}
                                {criteria.averageOrderValue.min && `Min: ${criteria.averageOrderValue.min}₺`}
                                {criteria.averageOrderValue.max && ` Max: ${criteria.averageOrderValue.max}₺`}
                              </div>
                            )}
                            {criteria.lastPurchaseDays && (
                              <div>
                                <span className="font-medium">Son Ziyaret:</span>{' '}
                                {criteria.lastPurchaseDays.min && `Min: ${criteria.lastPurchaseDays.min} gün`}
                                {criteria.lastPurchaseDays.max && ` Max: ${criteria.lastPurchaseDays.max} gün`}
                              </div>
                            )}
                          </>
                        )
                      } catch (e) {
                        return <div>Kriterler yüklenemedi</div>
                      }
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Manual Rules */}
            {!segment.isAutomatic && segment.rules && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Manuel Segment Kuralları</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{segment.rules}</p>
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Customer List */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Müşteri Listesi ({customers.length})</h3>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                </div>
              ) : customers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Bu segmentte henüz müşteri bulunmuyor
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Müşteri</TableHead>
                        <TableHead>Seviye</TableHead>
                        <TableHead>Puan</TableHead>
                        <TableHead>İşlem Sayısı</TableHead>
                        <TableHead>Son Ziyaret</TableHead>
                        <TableHead>Eklenme Tarihi</TableHead>
                        {!segment.isAutomatic && (
                          <TableHead className="w-[70px]"></TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-sm text-gray-500 flex items-center gap-2">
                                <Mail className="h-3 w-3" />
                                {customer.email}
                              </div>
                              {customer.phone && (
                                <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                  <Phone className="h-3 w-3" />
                                  {customer.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={levelColors[customer.level]}>
                              {levelLabels[customer.level]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <CreditCard className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{customer.points}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {customer._count.transactions} işlem
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {customer.lastVisit ? (
                              <span className="text-sm">
                                {format(new Date(customer.lastVisit), 'dd MMM yyyy', { locale: tr })}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {format(new Date(customer.createdAt), 'dd MMM yyyy', { locale: tr })}
                            </span>
                          </TableCell>
                          {!segment.isAutomatic && (
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeCustomer(customer.id)}
                              >
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}