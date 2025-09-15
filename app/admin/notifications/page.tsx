'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Plus, Send, Users, Eye, Calendar, MessageSquare, Rocket, Gift, Star, Target, Filter, Smartphone, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface NotificationLog {
  id: string
  title: string
  body: string
  type: 'CAMPAIGN' | 'REWARD' | 'POINTS' | 'GENERAL'
  targetCustomerIds: string
  sentCount: number
  failedCount: number
  createdAt: string
}

interface Customer {
  id: string
  name: string
  phone: string
  loyaltyTier: string
  segment: string
  totalPoints: number
  hasSubscription: boolean
}

interface NotificationFilters {
  targetType: 'all' | 'segment' | 'tier'
  segments: string[]
  tiers: string[]
}

interface NotificationForm {
  title: string
  body: string
  type: 'CAMPAIGN' | 'REWARD' | 'POINTS' | 'GENERAL'
  filters: NotificationFilters
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationLog[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<NotificationLog | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [totalNotifications, setTotalNotifications] = useState(0)
  
  // Filter state
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: '',
    type: 'all' as 'all' | 'CAMPAIGN' | 'REWARD' | 'POINTS' | 'GENERAL'
  })
  const [searchTerm, setSearchTerm] = useState('')
  
  const [form, setForm] = useState<NotificationForm>({
    title: '',
    body: '',
    type: 'GENERAL',
    filters: {
      targetType: 'all',
      segments: [],
      tiers: []
    }
  })

  // Real data from database
  const [availableSegments, setAvailableSegments] = useState<Array<{
    name: string, key: string, description: string, count: number, color: string
  }>>([])
  
  const [availableTiers, setAvailableTiers] = useState<Array<{
    key: string, name: string, displayName: string, color: string, count: number
  }>>([])
  
  const [totalCustomerCount, setTotalCustomerCount] = useState(0)
  const [pushSubscriberCount, setPushSubscriberCount] = useState(0)

  useEffect(() => {
    loadNotifications(currentPage)
  }, [currentPage])

  useEffect(() => {
    loadCustomers()
    loadSegments()
    loadTiers()
    loadStats()
  }, [])

  const loadNotifications = async (page = currentPage) => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        ...(dateFilter.startDate && { startDate: dateFilter.startDate }),
        ...(dateFilter.endDate && { endDate: dateFilter.endDate }),
        ...(dateFilter.type !== 'all' && { type: dateFilter.type }),
        ...(searchTerm && { search: searchTerm })
      })
      
      const response = await fetch(`/api/admin/notifications?${queryParams}`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setTotalNotifications(data.total || 0)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
      toast.error('Bildirimler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      loadNotifications(1)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm, dateFilter])

  const loadCustomers = async () => {
    try {
      const response = await fetch('/api/admin/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error('Error loading customers:', error)
    }
  }

  const loadSegments = async () => {
    try {
      const response = await fetch('/api/segments')
      if (response.ok) {
        const data = await response.json()
        const segmentsWithColors = data.segments?.map((segment: any, index: number) => ({
          name: segment.name,
          key: segment.name,
          description: segment.description || `${segment.name} segmenti`,
          count: segment._count?.customers || 0,
          color: ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-gray-500', 'bg-pink-500'][index % 6]
        })) || []
        setAvailableSegments(segmentsWithColors)
      }
    } catch (error) {
      console.error('Error loading segments:', error)
    }
  }

  const loadTiers = async () => {
    try {
      const response = await fetch('/api/tiers')
      if (response.ok) {
        const data = await response.json()
        const tiersWithColors = data.tiers?.map((tier: any) => ({
          key: tier.name,
          name: tier.name,
          displayName: tier.displayName,
          color: tier.color || 'bg-gray-500',
          count: tier._count?.customers || 0
        })) || []
        setAvailableTiers(tiersWithColors)
      }
    } catch (error) {
      console.error('Error loading tiers:', error)
    }
  }

  const loadStats = async () => {
    try {
      const [customersResponse, subscriptionsResponse] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/mobile/notifications/subscribers')
      ])
      
      if (customersResponse.ok) {
        const customersData = await customersResponse.json()
        setTotalCustomerCount(customersData.customers?.length || 0)
      }
      
      if (subscriptionsResponse.ok) {
        const subscriptionsData = await subscriptionsResponse.json()
        setPushSubscriberCount(subscriptionsData.subscribers?.length || 0)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  // Real data için hedef sayısı hesaplama
  const getRealTargetCount = (): number => {
    const { targetType, segments, tiers } = form.filters
    
    if (targetType === 'all') {
      return totalCustomerCount
    }
    
    if (targetType === 'segment' && segments.length > 0) {
      return availableSegments
        .filter(seg => segments.includes(seg.key))
        .reduce((total, seg) => total + seg.count, 0)
    }
    
    if (targetType === 'tier' && tiers.length > 0) {
      return availableTiers
        .filter(tier => tiers.includes(tier.key))
        .reduce((total, tier) => total + tier.count, 0)
    }
    
    return 0
  }

  const getFilteredCustomers = (): Customer[] => {
    const { targetType, segments, tiers } = form.filters

    if (targetType === 'all') {
      return customers
    }

    const filtered = customers.filter(customer => {
      if (targetType === 'segment' && segments.length > 0) {
        return segments.includes(customer.segment)
      }
      
      if (targetType === 'tier' && tiers.length > 0) {
        return tiers.includes(customer.loyaltyTier)
      }
      
      return false
    })
    
    return filtered
  }
  
  const getTargetCount = (): number => {
    return getRealTargetCount()
  }

  const handleSendNotification = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error('Başlık ve mesaj gerekli')
      return
    }

    const targetCount = getTargetCount()
    if (targetCount === 0) {
      toast.error('Hedef müşteri seçmelisiniz')
      return
    }

    setSending(true)
    try {
      // Get target customer IDs based on filters
      let targetCustomerIds: string[] = []
      
      if (form.filters.targetType === 'all') {
        // Get all customer IDs
        const customersResponse = await fetch('/api/admin/customers')
        if (customersResponse.ok) {
          const allCustomers = await customersResponse.json()
          targetCustomerIds = allCustomers.map((c: any) => c.id)
        }
      } else if (form.filters.targetType === 'segment' && form.filters.segments.length > 0) {
        // Get customers by segments
        const customersResponse = await fetch('/api/admin/customers')
        if (customersResponse.ok) {
          const allCustomers = await customersResponse.json()
          targetCustomerIds = allCustomers
            .filter((c: any) => form.filters.segments.includes(c.segment))
            .map((c: any) => c.id)
        }
      } else if (form.filters.targetType === 'tier' && form.filters.tiers.length > 0) {
        // Get customers by tiers
        const customersResponse = await fetch('/api/admin/customers')
        if (customersResponse.ok) {
          const allCustomers = await customersResponse.json()
          targetCustomerIds = allCustomers
            .filter((c: any) => form.filters.tiers.includes(c.loyaltyTier))
            .map((c: any) => c.id)
        }
      }

      if (targetCustomerIds.length === 0) {
        toast.error('Hedef müşteri bulunamadı')
        setSending(false)
        return
      }

      const response = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: form.title,
          body: form.body,
          type: form.type,
          targetCustomerIds: targetCustomerIds
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Bildirim gönderildi! ${result.sentCount} başarılı, ${result.failedCount} başarısız`)
        setShowCreateDialog(false)
        setForm({
          title: '',
          body: '',
          type: 'GENERAL',
          filters: {
            targetType: 'all',
            segments: [],
            tiers: []
          }
        })
        loadNotifications(1)
        setCurrentPage(1)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Bildirim gönderilemedi')
      }
    } catch (error) {
      console.error('Error sending notification:', error)
      toast.error('Bildirim gönderilirken hata oluştu')
    } finally {
      setSending(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'CAMPAIGN': return 'bg-blue-100 text-blue-800'
      case 'REWARD': return 'bg-green-100 text-green-800'
      case 'POINTS': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'CAMPAIGN': return 'Kampanya'
      case 'REWARD': return 'Ödül'
      case 'POINTS': return 'Puan'
      default: return 'Genel'
    }
  }

  return (
    <div className="admin-app p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="w-8 h-8" />
            Bildirim Yönetimi
          </h1>
          <p className="text-muted-foreground">
            Müşterilerinize push bildirim gönderin ve geçmişi görüntüleyin
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Yeni Bildirim
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg">
                  <Send className="h-6 w-6" />
                </div>
                Yeni Bildirim Gönder
              </DialogTitle>
              <DialogDescription>
                Hedeflenmiş müşteri gruplarına anında push bildirimi gönderin
              </DialogDescription>
            </DialogHeader>

            <div className="flex gap-6 flex-1 overflow-hidden">
              {/* Sol Panel - Form */}
              <div className="w-2/3 space-y-6 overflow-y-auto pr-4">
                {/* Bildirim İçeriği */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    Bildirim İçeriği
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-sm font-medium flex items-center gap-2">
                        <span className="text-red-500">*</span>
                        Başlık
                      </Label>
                      <Input
                        id="title"
                        placeholder="Özel kampanya başladı!"
                        value={form.title}
                        onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                        className="border-blue-200 focus:border-blue-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="body" className="text-sm font-medium flex items-center gap-2">
                        <span className="text-red-500">*</span>
                        Mesaj İçeriği
                      </Label>
                      <Textarea
                        id="body"
                        placeholder="Bu fırsatı kaçırmayın! %20 indirimli ürünleri keşfedin."
                        value={form.body}
                        onChange={(e) => setForm(prev => ({ ...prev, body: e.target.value }))}
                        rows={4}
                        className="border-blue-200 focus:border-blue-400 resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type" className="text-sm font-medium">Bildirim Kategorisi</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'GENERAL', label: 'Genel', icon: Bell, color: 'bg-gray-500' },
                          { value: 'CAMPAIGN', label: 'Kampanya', icon: Rocket, color: 'bg-blue-500' },
                          { value: 'REWARD', label: 'Ödül', icon: Gift, color: 'bg-green-500' },
                          { value: 'POINTS', label: 'Puan', icon: Star, color: 'bg-yellow-500' }
                        ].map(({ value, label, icon: Icon, color }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, type: value as any }))}
                            className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                              form.type === value 
                                ? `border-blue-400 bg-blue-50 shadow-md` 
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className={`p-2 ${color} text-white rounded-lg`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="font-medium text-gray-900">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hedef Seçimi */}
                <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-xl border border-green-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-600" />
                    Hedef Müşteri Seçimi
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Hedefleme Yöntemi</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { value: 'all', label: 'Tüm Müşteriler', icon: Users, desc: 'Tüm kayıtlı müşterilere gönder' },
                          { value: 'segment', label: 'Segment Bazlı', icon: Filter, desc: 'Belirli müşteri gruplarına gönder' },
                          { value: 'tier', label: 'Seviye Bazlı', icon: Star, desc: 'Sadakat seviyelerine göre gönder' }
                        ].map(({ value, label, icon: Icon, desc }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setForm(prev => ({
                              ...prev,
                              filters: { ...prev.filters, targetType: value as any }
                            }))}
                            className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left ${
                              form.filters.targetType === value 
                                ? `border-green-400 bg-green-50 shadow-md` 
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className={`p-2 ${form.filters.targetType === value ? 'bg-green-500' : 'bg-gray-400'} text-white rounded-lg`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{label}</div>
                              <div className="text-xs text-gray-500">{desc}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Segment Seçimi */}
                    {form.filters.targetType === 'segment' && (
                      <div className="space-y-3 bg-white p-4 rounded-lg border border-blue-100">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Filter className="h-4 w-4 text-blue-600" />
                          Hedef Segmentler
                        </Label>
                        <div className="space-y-2">
                          {availableSegments.map(segment => (
                            <div key={segment.key} className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              form.filters.segments.includes(segment.key) 
                                ? 'border-blue-400 bg-blue-50 shadow-md' 
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}>
                              <div className="flex items-center space-x-3">
                                <Checkbox
                                  id={`segment-${segment.key}`}
                                  checked={form.filters.segments.includes(segment.key)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setForm(prev => ({
                                        ...prev,
                                        filters: {
                                          ...prev.filters,
                                          segments: [...prev.filters.segments, segment.key]
                                        }
                                      }))
                                    } else {
                                      setForm(prev => ({
                                        ...prev,
                                        filters: {
                                          ...prev.filters,
                                          segments: prev.filters.segments.filter(s => s !== segment.key)
                                        }
                                      }))
                                    }
                                  }}
                                />
                                <div className={`w-3 h-3 rounded-full ${segment.color}`} />
                                <div>
                                  <Label htmlFor={`segment-${segment.key}`} className="font-medium cursor-pointer">{segment.name}</Label>
                                  <div className="text-xs text-gray-500">{segment.description}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-semibold text-gray-700">{segment.count}</div>
                                <div className="text-xs text-gray-500">müşteri</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tier Seçimi */}
                    {form.filters.targetType === 'tier' && (
                      <div className="space-y-3 bg-white p-4 rounded-lg border border-yellow-100">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-600" />
                          Sadakat Seviyeleri
                        </Label>
                        <div className="space-y-2">
                          {availableTiers.map((tier, index) => {
                            return (
                              <div key={tier.key} className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                form.filters.tiers.includes(tier.key) 
                                  ? 'border-yellow-400 bg-yellow-50 shadow-md' 
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}>
                                <div className="flex items-center space-x-3">
                                  <Checkbox
                                    id={`tier-${tier.key}`}
                                    checked={form.filters.tiers.includes(tier.key)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setForm(prev => ({
                                          ...prev,
                                          filters: {
                                            ...prev.filters,
                                            tiers: [...prev.filters.tiers, tier.key]
                                          }
                                        }))
                                      } else {
                                        setForm(prev => ({
                                          ...prev,
                                          filters: {
                                            ...prev.filters,
                                            tiers: prev.filters.tiers.filter(t => t !== tier.key)
                                          }
                                        }))
                                      }
                                    }}
                                  />
                                  <div className={`w-4 h-4 rounded ${tier.color}`} />
                                  <div className="flex items-center gap-2">
                                    <div className="flex">
                                      {[...Array(Math.min(index + 1, 5))].map((_, i) => (
                                        <Star key={i} className="h-3 w-3 text-yellow-500 fill-current" />
                                      ))}
                                    </div>
                                    <Label htmlFor={`tier-${tier.key}`} className="font-medium cursor-pointer">
                                      {tier.displayName || tier.name}
                                    </Label>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-semibold text-gray-700">{tier.count}</div>
                                  <div className="text-xs text-gray-500">müşteri</div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>

              {/* Sağ Panel - Önizleme ve Hedef Bilgisi */}
              <div className="w-1/3 space-y-6">
                {/* Bildirim Önizleme */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-gray-600" />
                    Önizleme
                  </h3>
                  
                  {/* Mobil Bildirim Mock-up */}
                  <div className="bg-white rounded-lg p-4 shadow-lg border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Bell className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">
                          {form.title || 'Bildirim Başlığı'}
                        </div>
                        <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {form.body || 'Bildirim mesajınız burada görünecek...'}
                        </div>
                        <div className="text-xs text-gray-400 mt-2">
                          Air CRM • şimdi
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hedef İstatistikleri */}
                <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-xl border border-green-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-600" />
                    Hedef Analizi
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Hedeflenen Müşteri</span>
                        <div className="text-2xl font-bold text-green-600">
                          {getTargetCount()}
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${totalCustomerCount > 0 ? (getTargetCount() / totalCustomerCount) * 100 : 0}%` 
                          }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Toplam {totalCustomerCount} müşteriden %{totalCustomerCount > 0 ? Math.round((getTargetCount() / totalCustomerCount) * 100) : 0}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 border border-blue-100">
                        <div className="text-xs text-gray-500 mb-1">Push Abonesi</div>
                        <div className="text-lg font-bold text-blue-600">
                          {pushSubscriberCount}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-purple-100">
                        <div className="text-xs text-gray-500 mb-1">Toplam Kayıt</div>
                        <div className="text-lg font-bold text-purple-600">
                          {totalCustomerCount}
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="text-xs text-yellow-800">
                        <div className="font-medium mb-1">ℹ️ Bilgi</div>
                        <div>Tüm kayıtlı müşteriler hedeflenir. Push aboneliği durumu önemli değildir.</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Alt Butonlar */}
            <div className="flex justify-between items-center pt-4 mt-4 border-t bg-gradient-to-r from-gray-50 to-blue-50">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Bell className="h-4 w-4" />
                <span>Bildirim {getTargetCount()} müşteriye gönderilecek</span>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  disabled={sending}
                  className="px-6"
                >
                  İptal
                </Button>
                <Button
                  onClick={handleSendNotification}
                  disabled={sending || !form.title.trim() || !form.body.trim() || getTargetCount() === 0}
                  className="px-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  {sending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Gönderiliyor...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Bildirim Gönder
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Toplam Bildirim</p>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Başarılı Gönderim</p>
                <p className="text-2xl font-bold">
                  {notifications.reduce((sum, n) => sum + n.sentCount, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Aktif Müşteri</p>
                <p className="text-2xl font-bold">{totalCustomerCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Bu Ay</p>
                <p className="text-2xl font-bold">
                  {notifications.filter(n => 
                    new Date(n.createdAt).getMonth() === new Date().getMonth()
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bildirim Geçmişi */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Bildirim Geçmişi</CardTitle>
              <CardDescription>
                Gönderilen tüm bildirimleri görüntüleyebilir ve filtreyebilirsiniz
              </CardDescription>
            </div>
            <div className="text-sm text-gray-500">
              Toplam {totalNotifications} bildirim
            </div>
          </div>
          
          {/* Filtreler */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Başlık veya mesajda ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <Input
              type="date"
              placeholder="Başlangıç tarihi"
              value={dateFilter.startDate}
              onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
            />
            
            <Input
              type="date"
              placeholder="Bitiş tarihi"
              value={dateFilter.endDate}
              onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
            />
            
            <Select
              value={dateFilter.type}
              onValueChange={(value: any) => setDateFilter(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Türler</SelectItem>
                <SelectItem value="GENERAL">Genel</SelectItem>
                <SelectItem value="CAMPAIGN">Kampanya</SelectItem>
                <SelectItem value="REWARD">Ödül</SelectItem>
                <SelectItem value="POINTS">Puan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Yükleniyor...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">
                {searchTerm || dateFilter.startDate || dateFilter.endDate || dateFilter.type !== 'all' 
                  ? 'Filtre kriterlerinize uygun bildirim bulunamadı' 
                  : 'Henüz bildirim yok'}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || dateFilter.startDate || dateFilter.endDate || dateFilter.type !== 'all'
                  ? 'Filtreleri değiştirip tekrar deneyebilirsiniz'
                  : 'İlk bildiriminizi gönderin'}
              </p>
            </div>
          ) : (
            <>
              {/* Notification List */}
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="border rounded-xl p-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-200 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            notification.type === 'CAMPAIGN' ? 'bg-blue-100 text-blue-600' :
                            notification.type === 'REWARD' ? 'bg-green-100 text-green-600' :
                            notification.type === 'POINTS' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {notification.type === 'CAMPAIGN' ? <Rocket className="h-4 w-4" /> :
                             notification.type === 'REWARD' ? <Gift className="h-4 w-4" /> :
                             notification.type === 'POINTS' ? <Star className="h-4 w-4" /> :
                             <Bell className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                            <Badge className={getTypeColor(notification.type)} variant="secondary">
                              {getTypeLabel(notification.type)}
                            </Badge>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 line-clamp-2 ml-12">
                          {notification.body}
                        </p>
                        
                        <div className="flex items-center gap-6 text-xs text-gray-500 ml-12">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {format(new Date(notification.createdAt), 'dd MMM yyyy HH:mm', { locale: tr })}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 text-green-600">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>{notification.sentCount} başarılı</span>
                            </div>
                            {notification.failedCount > 0 && (
                              <div className="flex items-center gap-1 text-red-600">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <span>{notification.failedCount} başarısız</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedNotification(notification)}
                        className="shrink-0 hover:bg-blue-100 hover:text-blue-600"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Detay
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalNotifications > itemsPerPage && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalNotifications)} arası, 
                    toplam {totalNotifications} bildirim
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Önceki
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, Math.ceil(totalNotifications / itemsPerPage)) }, (_, i) => {
                        const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i
                        const totalPages = Math.ceil(totalNotifications / itemsPerPage)
                        
                        if (pageNum > totalPages) return null
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalNotifications / itemsPerPage)))}
                      disabled={currentPage >= Math.ceil(totalNotifications / itemsPerPage)}
                    >
                      Sonraki
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Detail Dialog */}
      {selectedNotification && (
        <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl">
                <div className={`p-3 rounded-xl ${
                  selectedNotification.type === 'CAMPAIGN' ? 'bg-blue-100 text-blue-600' :
                  selectedNotification.type === 'REWARD' ? 'bg-green-100 text-green-600' :
                  selectedNotification.type === 'POINTS' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {selectedNotification.type === 'CAMPAIGN' ? <Rocket className="h-6 w-6" /> :
                   selectedNotification.type === 'REWARD' ? <Gift className="h-6 w-6" /> :
                   selectedNotification.type === 'POINTS' ? <Star className="h-6 w-6" /> :
                   <Bell className="h-6 w-6" />}
                </div>
                Bildirim Detayları
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Notification Preview */}
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-xl border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-gray-600" />
                  Bildirim Önizlemesi
                </h3>
                
                <div className="bg-white rounded-lg p-4 shadow-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bell className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900">
                        {selectedNotification.title}
                      </div>
                      <div className="text-xs text-gray-600 mt-1 leading-relaxed">
                        {selectedNotification.body}
                      </div>
                      <div className="text-xs text-gray-400 mt-2 flex items-center gap-2">
                        <span>Air CRM</span>
                        <span>•</span>
                        <span>{format(new Date(selectedNotification.createdAt), 'HH:mm', { locale: tr })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <Send className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {selectedNotification.sentCount}
                      </div>
                      <div className="text-xs text-green-600">Başarılı</div>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                      <X className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">
                        {selectedNotification.failedCount}
                      </div>
                      <div className="text-xs text-red-600">Başarısız</div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {JSON.parse(selectedNotification.targetCustomerIds).length}
                      </div>
                      <div className="text-xs text-blue-600">Hedef</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Success Rate */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Başarı Oranı</span>
                  <span className="text-sm font-bold text-gray-900">
                    %{Math.round((selectedNotification.sentCount / (selectedNotification.sentCount + selectedNotification.failedCount)) * 100)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${(selectedNotification.sentCount / (selectedNotification.sentCount + selectedNotification.failedCount)) * 100}%` 
                    }}
                  />
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Bildirim Türü</Label>
                  <div className="flex items-center gap-2">
                    <Badge className={getTypeColor(selectedNotification.type)} variant="secondary">
                      {getTypeLabel(selectedNotification.type)}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Gönderim Tarihi</Label>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(selectedNotification.createdAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}