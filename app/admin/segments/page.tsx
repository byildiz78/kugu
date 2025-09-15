'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EnhancedSegmentsView } from '@/components/admin/segments/enhanced-segments-view'
import { SegmentForm } from '@/components/admin/segments/segment-form'
import { CustomerSelector } from '@/components/admin/segments/customer-selector'
import { SegmentDetailModal } from '@/components/admin/segments/segment-detail-modal'
import { Plus, Target, Users, TrendingUp, Search, RefreshCw } from 'lucide-react'
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

export default function SegmentsPage() {
  const [segments, setSegments] = useState<SegmentWithDetails[]>([])
  const [stats, setStats] = useState<SegmentStats>({
    total: 0,
    automatic: 0,
    manual: 0,
    totalCustomers: 0,
    averageSize: 0
  })
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [customerSelectorOpen, setCustomerSelectorOpen] = useState(false)
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null)
  const [selectedSegment, setSelectedSegment] = useState<SegmentWithDetails | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  const fetchSegments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchValue && { search: searchValue })
      })

      const response = await fetch(`/api/segments?${params}`)
      if (!response.ok) throw new Error('Failed to fetch segments')
      
      const data = await response.json()
      setSegments(data.segments)
      
      // Calculate stats
      const totalCustomers = data.segments.reduce(
        (sum: number, s: SegmentWithDetails) => sum + s._count.customers, 0
      )
      const automaticCount = data.segments.filter((s: SegmentWithDetails) => s.isAutomatic).length
      const manualCount = data.segments.length - automaticCount
      
      setStats({
        total: data.pagination.total,
        automatic: automaticCount,
        manual: manualCount,
        totalCustomers,
        averageSize: data.segments.length > 0 ? Math.round(totalCustomers / data.segments.length) : 0
      })
    } catch (error) {
      console.error('Error fetching segments:', error)
      toast.error('Segmentler yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSegments()
  }, [currentPage, searchValue])

  const handleCreateSegment = async (data: any) => {
    try {
      setFormLoading(true)
      const response = await fetch('/api/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, restaurantId: 'default-restaurant-id' })
      })

      if (!response.ok) throw new Error('Failed to create segment')
      
      toast.success('Segment başarıyla oluşturuldu')
      setFormOpen(false)
      fetchSegments()
    } catch (error) {
      console.error('Error creating segment:', error)
      toast.error('Segment oluşturulurken hata oluştu')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateSegment = async (data: any) => {
    if (!editingSegment) return

    try {
      setFormLoading(true)
      
      const response = await fetch(`/api/segments/${editingSegment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Update error response:', errorData)
        throw new Error('Failed to update segment')
      }
      
      toast.success('Segment başarıyla güncellendi')
      setFormOpen(false)
      setEditingSegment(null)
      fetchSegments()
    } catch (error) {
      console.error('Error updating segment:', error)
      toast.error('Segment güncellenirken hata oluştu')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteSegment = async (segment: SegmentWithDetails) => {
    if (!confirm('Bu segmenti silmek istediğinizden emin misiniz?')) return

    try {
      const response = await fetch(`/api/segments/${segment.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete segment')
      
      toast.success('Segment başarıyla silindi')
      fetchSegments()
    } catch (error) {
      console.error('Error deleting segment:', error)
      toast.error('Segment silinirken hata oluştu')
    }
  }

  const handleEdit = (segment: SegmentWithDetails) => {
    setEditingSegment(segment)
    setFormOpen(true)
  }

  const handleView = (segment: SegmentWithDetails) => {
    setSelectedSegment(segment)
    setDetailModalOpen(true)
  }

  const handleManageCustomers = (segment: SegmentWithDetails) => {
    setSelectedSegment(segment)
    setCustomerSelectorOpen(true)
  }

  const handleRefreshSegment = async (segment: SegmentWithDetails) => {
    if (!segment.isAutomatic) return

    try {
      const response = await fetch(`/api/segments/${segment.id}/refresh`, {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Failed to refresh segment')
      
      const result = await response.json()
      toast.success(result.message)
      fetchSegments()
    } catch (error) {
      console.error('Error refreshing segment:', error)
      toast.error('Segment yenilenirken hata oluştu')
    }
  }
  const handleAddCustomers = async (customerIds: string[]) => {
    if (!selectedSegment || formLoading) return

    try {
      setFormLoading(true)
      const response = await fetch(`/api/segments/${selectedSegment.id}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerIds })
      })

      if (!response.ok) throw new Error('Failed to add customers')
      
      const result = await response.json()
      toast.success(result.message)
      fetchSegments()
    } catch (error) {
      console.error('Error adding customers:', error)
      toast.error('Müşteriler eklenirken hata oluştu')
    } finally {
      setFormLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchSegments()
  }

  const handleRefreshAllSegments = async () => {
    try {
      setFormLoading(true)
      toast.info('Tüm segmentler yenileniyor...')
      
      // Get all automatic segments
      const automaticSegments = segments.filter(s => s.isAutomatic)
      let successCount = 0
      let errorCount = 0
      
      for (const segment of automaticSegments) {
        try {
          const response = await fetch(`/api/segments/${segment.id}/refresh`, {
            method: 'POST'
          })
          
          if (response.ok) {
            successCount++
          } else {
            errorCount++
          }
        } catch (error) {
          errorCount++
        }
      }
      
      if (successCount > 0 && errorCount === 0) {
        toast.success(`${successCount} segment başarıyla yenilendi`)
      } else if (successCount > 0 && errorCount > 0) {
        toast.warning(`${successCount} segment yenilendi, ${errorCount} segment başarısız`)
      } else {
        toast.error('Segmentler yenilenirken hata oluştu')
      }
      
      fetchSegments()
    } catch (error) {
      console.error('Error refreshing all segments:', error)
      toast.error('Segmentler yenilenirken hata oluştu')
    } finally {
      setFormLoading(false)
    }
  }

  const statsCards = [
    {
      title: 'Toplam Segment',
      value: stats.total.toString(),
      description: 'Aktif segment sayısı',
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Segmentli Müşteri',
      value: stats.totalCustomers.toString(),
      description: 'En az bir segmentte',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Ortalama Boyut',
      value: stats.averageSize.toString(),
      description: 'Segment başına müşteri',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Segment Yönetimi</h1>
          <p className="text-gray-600">Müşteri segmentlerini oluşturun ve yönetin</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Segment
        </Button>
      </div>

      {/* Enhanced Segments View */}
      <EnhancedSegmentsView
        segments={segments}
        stats={stats}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDeleteSegment}
        onView={handleView}
        onManageCustomers={handleManageCustomers}
        onRefresh={handleRefreshSegment}
        onRefreshAll={handleRefreshAllSegments}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />

      {/* Segment Form Dialog */}
      <SegmentForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingSegment(null)
        }}
        segment={editingSegment}
        onSubmit={editingSegment ? handleUpdateSegment : handleCreateSegment}
        isLoading={formLoading}
      />

      {/* Customer Selector Dialog */}
      <CustomerSelector
        open={customerSelectorOpen}
        onOpenChange={setCustomerSelectorOpen}
        segmentId={selectedSegment?.id || ''}
        onAddCustomers={handleAddCustomers}
        isLoading={formLoading}
      />

      {/* Segment Detail Modal */}
      <SegmentDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        segment={selectedSegment}
      />
    </div>
  )
}