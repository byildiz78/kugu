'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { List, BarChart3 } from 'lucide-react'
import { CampaignList } from './CampaignList'
import { CampaignUsages } from './CampaignUsages'
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

interface CampaignTabsProps {
  campaigns: CampaignWithDetails[]
  stats: CampaignStats
  loading: boolean
  onEdit: (campaign: CampaignWithDetails) => void
  onDelete: (campaign: CampaignWithDetails) => void
  onView: (campaign: CampaignWithDetails) => void
  onToggleStatus: (campaign: CampaignWithDetails) => void
  onRefresh: () => void
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

export function CampaignTabs({
  campaigns,
  stats,
  loading,
  onEdit,
  onDelete,
  onView,
  onToggleStatus,
  onRefresh,
  searchValue,
  setSearchValue,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
  currentPage,
  setCurrentPage,
  handleSearch
}: CampaignTabsProps) {
  const [activeTab, setActiveTab] = useState('campaigns')

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="campaigns" className="flex items-center gap-2">
          <List className="h-4 w-4" />
          Kampanyalar
        </TabsTrigger>
        <TabsTrigger value="usages" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Kampanya Kullanımları
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="campaigns" className="mt-6">
        <CampaignList
          campaigns={campaigns}
          stats={stats}
          loading={loading}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
          onToggleStatus={onToggleStatus}
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
      </TabsContent>
      
      <TabsContent value="usages" className="mt-6">
        <CampaignUsages onRefresh={onRefresh} />
      </TabsContent>
    </Tabs>
  )
}