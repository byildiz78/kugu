'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { CampaignTabs } from '@/components/admin/campaigns/CampaignTabs'
import { SimpleCampaignModal } from '@/components/admin/campaigns/SimpleCampaignModal'
import { Plus } from 'lucide-react'
import { Campaign } from '@prisma/client'
import { toast } from 'sonner'

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

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignWithDetails[]>([])
  const [stats, setStats] = useState<CampaignStats>({
    total: 0,
    active: 0,
    totalUsages: 0,
    averageUsage: 0
  })
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  
  // Filters
  const [searchValue, setSearchValue] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchValue && { search: searchValue }),
        ...(typeFilter && typeFilter !== 'ALL' && { type: typeFilter }),
        ...(statusFilter && statusFilter !== 'ALL' && { status: statusFilter })
      })

      const response = await fetch(`/api/campaigns?${params}`)
      if (!response.ok) throw new Error('Failed to fetch campaigns')
      
      const data = await response.json()
      setCampaigns(data.campaigns)
      
      // Calculate stats
      const now = new Date()
      const activeCampaigns = data.campaigns.filter((c: CampaignWithDetails) => 
        c.isActive && 
        new Date(c.startDate) <= now && 
        new Date(c.endDate) >= now
      )
      
      const totalUsages = data.campaigns.reduce(
        (sum: number, c: CampaignWithDetails) => sum + (c._count.usages || 0) + (c._count.transactions || 0), 0
      )
      
      setStats({
        total: data.pagination.total,
        active: activeCampaigns.length,
        totalUsages,
        averageUsage: data.campaigns.length > 0 ? Math.round(totalUsages / data.campaigns.length) : 0
      })
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      toast.error('Kampanyalar yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [currentPage, searchValue, typeFilter, statusFilter])

  const handleCreateCampaign = async (data: any) => {
    try {
      setFormLoading(true)
      
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Failed to create campaign: ${errorData}`)
      }
      
      toast.success('Kampanya başarıyla oluşturuldu')
      setFormOpen(false)
      fetchCampaigns()
    } catch (error) {
      console.error('Error creating campaign:', error)
      toast.error('Kampanya oluşturulurken hata oluştu')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateCampaign = async (data: any) => {
    if (!editingCampaign) {
      return
    }

    try {
      setFormLoading(true)
      
      const response = await fetch(`/api/campaigns/${editingCampaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to update campaign: ${errorData.message || response.statusText}`)
      }
      
      toast.success('Kampanya başarıyla güncellendi')
      setFormOpen(false)
      setEditingCampaign(null)
      fetchCampaigns()
    } catch (error) {
      console.error('Error updating campaign:', error)
      toast.error('Kampanya güncellenirken hata oluştu')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteCampaign = async (campaign: CampaignWithDetails) => {
    if (!confirm('Bu kampanyayı silmek istediğinizden emin misiniz?')) return

    try {
      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete campaign')
      
      toast.success('Kampanya başarıyla silindi')
      fetchCampaigns()
    } catch (error) {
      console.error('Error deleting campaign:', error)
      toast.error('Kampanya silinirken hata oluştu')
    }
  }

  const handleToggleStatus = async (campaign: CampaignWithDetails) => {
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !campaign.isActive })
      })

      if (!response.ok) throw new Error('Failed to toggle campaign status')
      
      toast.success(`Kampanya ${!campaign.isActive ? 'aktifleştirildi' : 'duraklatıldı'}`)
      fetchCampaigns()
    } catch (error) {
      console.error('Error toggling campaign status:', error)
      toast.error('Kampanya durumu değiştirilirken hata oluştu')
    }
  }

  const handleEdit = (campaign: CampaignWithDetails) => {
    setEditingCampaign(campaign)
    setFormOpen(true)
  }

  const handleView = (campaign: CampaignWithDetails) => {
    // TODO: Implement campaign detail view
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchCampaigns()
  }


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kampanya Yönetimi</h1>
          <p className="text-gray-600">Müşterilerinize özel kampanyalar oluşturun ve yönetin</p>
        </div>
        <Button onClick={() => {
          setEditingCampaign(null)
          setFormOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Kampanya
        </Button>
      </div>

      {/* Campaign Tabs */}
      <CampaignTabs
        campaigns={campaigns}
        stats={stats}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDeleteCampaign}
        onView={handleView}
        onToggleStatus={handleToggleStatus}
        onRefresh={fetchCampaigns}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        handleSearch={handleSearch}
      />

      {/* Campaign Form Modal */}
      <SimpleCampaignModal
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingCampaign(null)
        }}
        campaign={editingCampaign}
        onSubmit={editingCampaign ? handleUpdateCampaign : handleCreateCampaign}
        isLoading={formLoading}
      />
    </div>
  )
}