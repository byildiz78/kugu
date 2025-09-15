'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { 
  Plus, 
  Crown,
  Users,
  TrendingUp,
  Star,
  Award,
  MoreHorizontal,
  Edit,
  Trash2,
  Palette,
  Settings,
  Target,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

interface Tier {
  id: string
  name: string
  displayName: string
  description?: string
  color: string
  gradient?: string
  icon?: string
  minTotalSpent?: number
  minVisitCount?: number
  minPoints?: number
  level: number
  pointMultiplier: number
  discountPercent?: number
  specialFeatures?: string
  isActive: boolean
  _count: {
    customers: number
  }
  createdAt: string
  updatedAt: string
}

const tierSchema = z.object({
  name: z.string().min(1, 'Seviye Adı gereklidir'),
  displayName: z.string().min(1, 'Görünen ad gereklidir'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Geçerli hex renk kodu gereklidir').default('#6B7280'),
  gradient: z.string().optional(),
  icon: z.string().optional(),
  minTotalSpent: z.number().min(0).optional(),
  minVisitCount: z.number().min(0).optional(),
  minPoints: z.number().min(0).optional(),
  level: z.number().min(0, 'Seviye 0 veya büyük olmalıdır'),
  pointMultiplier: z.number().min(0.1).max(10).default(1.0),
  discountPercent: z.number().min(0).max(100).optional(),
  specialFeatures: z.string().optional(),
  isActive: z.boolean().default(true)
})

type TierFormData = z.infer<typeof tierSchema>

const predefinedColors = [
  '#6B7280', '#EF4444', '#F59E0B', '#10B981', 
  '#3B82F6', '#8B5CF6', '#EC4899', '#F97316'
]

export default function TiersPage() {
  const [tiers, setTiers] = useState<Tier[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingTier, setEditingTier] = useState<Tier | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<TierFormData>({
    resolver: zodResolver(tierSchema),
    defaultValues: {
      color: '#6B7280',
      pointMultiplier: 1.0,
      level: 0,
      isActive: true
    }
  })

  const watchedColor = watch('color')

  const fetchTiers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tiers?includeInactive=true')
      if (!response.ok) throw new Error('Failed to fetch tiers')
      
      const data = await response.json()
      setTiers(data.tiers)
    } catch (error) {
      console.error('Error fetching tiers:', error)
      toast.error('Tier\'lar yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTiers()
  }, [])

  useEffect(() => {
    if (formOpen) {
      if (editingTier) {
        // Edit mode
        reset({
          name: editingTier.name,
          displayName: editingTier.displayName,
          description: editingTier.description || '',
          color: editingTier.color,
          gradient: editingTier.gradient || '',
          icon: editingTier.icon || '',
          minTotalSpent: editingTier.minTotalSpent || undefined,
          minVisitCount: editingTier.minVisitCount || undefined,
          minPoints: editingTier.minPoints || undefined,
          level: editingTier.level,
          pointMultiplier: editingTier.pointMultiplier,
          discountPercent: editingTier.discountPercent || undefined,
          specialFeatures: editingTier.specialFeatures || '',
          isActive: editingTier.isActive
        })
      } else {
        // Create mode
        const nextLevel = tiers.length > 0 ? Math.max(...tiers.map(t => t.level)) + 1 : 0
        reset({
          name: '',
          displayName: '',
          description: '',
          color: '#6B7280',
          gradient: '',
          icon: '',
          level: nextLevel,
          pointMultiplier: 1.0,
          isActive: true
        })
      }
    }
  }, [formOpen, editingTier, reset, tiers])

  const handleCreateTier = async (data: TierFormData) => {
    try {
      setFormLoading(true)
      const response = await fetch('/api/tiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create tier')
      }
      
      toast.success('Tier başarıyla oluşturuldu')
      setFormOpen(false)
      fetchTiers()
    } catch (error: any) {
      console.error('Error creating tier:', error)
      toast.error(error.message || 'Tier oluşturulurken hata oluştu')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateTier = async (data: TierFormData) => {
    if (!editingTier) return

    try {
      setFormLoading(true)
      const response = await fetch(`/api/tiers/${editingTier.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update tier')
      }
      
      toast.success('Tier başarıyla güncellendi')
      setFormOpen(false)
      setEditingTier(null)
      fetchTiers()
    } catch (error: any) {
      console.error('Error updating tier:', error)
      toast.error(error.message || 'Tier güncellenirken hata oluştu')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteTier = async (tier: Tier) => {
    if (!confirm(`"${tier.displayName}" tier'ını silmek istediğinizden emin misiniz?`)) return

    try {
      const response = await fetch(`/api/tiers/${tier.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete tier')
      }
      
      toast.success('Tier başarıyla silindi')
      fetchTiers()
    } catch (error: any) {
      console.error('Error deleting tier:', error)
      toast.error(error.message || 'Tier silinirken hata oluştu')
    }
  }

  const handleEdit = (tier: Tier) => {
    setEditingTier(tier)
    setFormOpen(true)
  }

  const getTierIcon = (iconName?: string) => {
    const iconMap: Record<string, any> = {
      crown: Crown,
      star: Star,
      award: Award,
      target: Target
    }
    return iconMap[iconName || 'crown'] || Crown
  }

  const formatRequirements = (tier: Tier) => {
    const requirements = []
    if (tier.minTotalSpent) requirements.push(`${tier.minTotalSpent}₺ harcama`)
    if (tier.minVisitCount) requirements.push(`${tier.minVisitCount} ziyaret`)
    if (tier.minPoints) requirements.push(`${tier.minPoints} puan`)
    return requirements.join(', ') || 'Gereksinim yok'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seviye Yönetimi</h1>
          <p className="text-gray-600">Müşteri seviyelerini yönetin ve koşulları belirleyin</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={fetchTiers}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
          <Button 
            onClick={() => setFormOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Seviye
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Tier</CardTitle>
            <Crown className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tiers.length}</div>
            <p className="text-xs text-muted-foreground">Tanımlı seviye</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Tier</CardTitle>
            <Settings className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tiers.filter(t => t.isActive).length}</div>
            <p className="text-xs text-muted-foreground">Kullanımda</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Müşteri</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tiers.reduce((sum, t) => sum + t._count.customers, 0)}</div>
            <p className="text-xs text-muted-foreground">Tier'lara atanmış</p>
          </CardContent>
        </Card>
      </div>

      {/* Tiers List */}
      <Card>
        <CardHeader>
          <CardTitle>Seviye Listesi</CardTitle>
          <CardDescription>
            Mevcut müşteri seviyeleri ve özellikler
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : tiers.length === 0 ? (
            <div className="text-center py-8">
              <Crown className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Henüz tier tanımlanmamış</p>
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                İlk Tier'ı Oluştur
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {tiers.map((tier) => {
                const TierIcon = getTierIcon(tier.icon)
                
                return (
                  <div
                    key={tier.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    {/* Icon & Level */}
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-3 rounded-lg"
                        style={{ backgroundColor: `${tier.color}20`, border: `2px solid ${tier.color}` }}
                      >
                        <TierIcon className="h-6 w-6" style={{ color: tier.color }} />
                      </div>
                      <div className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        Lv.{tier.level}
                      </div>
                    </div>

                    {/* Tier Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{tier.displayName}</h3>
                        <Badge 
                          variant={tier.isActive ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {tier.isActive ? "Aktif" : "Pasif"}
                        </Badge>
                        {tier.pointMultiplier !== 1 && (
                          <Badge variant="outline" className="text-xs">
                            {tier.pointMultiplier}x puan
                          </Badge>
                        )}
                        {tier.discountPercent && (
                          <Badge variant="outline" className="text-xs">
                            %{tier.discountPercent} indirim
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {tier.description || 'Açıklama yok'}
                      </p>
                      
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>
                          <strong>Koşullar:</strong> {formatRequirements(tier)}
                        </div>
                        {tier.specialFeatures && (
                          <div>
                            <strong>Özel Avantajlar:</strong> {tier.specialFeatures.length > 80 ? tier.specialFeatures.substring(0, 80) + '...' : tier.specialFeatures}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Customer Count */}
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">
                        {tier._count.customers}
                      </div>
                      <div className="text-xs text-gray-500">müşteri</div>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(tier)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteTier(tier)}
                          className="text-red-600"
                          disabled={tier._count.customers > 0}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tier Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTier ? 'Tier Düzenle' : 'Yeni Seviye Oluştur'}
            </DialogTitle>
            <DialogDescription>
              Müşteri seviyesi için gerekli bilgileri girin
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(editingTier ? handleUpdateTier : handleCreateTier)} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Seviye Adı *</Label>
                <Input
                  {...register('name')}
                  placeholder="bronze, silver, gold..."
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Görünen Ad *</Label>
                <Input
                  {...register('displayName')}
                  placeholder="Bronz Seviye"
                />
                {errors.displayName && (
                  <p className="text-sm text-red-500">{errors.displayName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Açıklama</Label>
              <Input
                {...register('description')}
                placeholder="Bu seviyenin özelliklerini açıklayın"
              />
            </div>

            {/* Visual */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Renk *</Label>
                <div className="flex gap-2">
                  <Input
                    {...register('color')}
                    placeholder="#6B7280"
                    className="font-mono"
                  />
                  <div 
                    className="w-12 h-10 rounded border-2 border-gray-200"
                    style={{ backgroundColor: watchedColor }}
                  />
                </div>
                <div className="flex gap-1">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="w-6 h-6 rounded border-2 border-gray-200 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => setValue('color', color)}
                    />
                  ))}
                </div>
                {errors.color && (
                  <p className="text-sm text-red-500">{errors.color.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Seviye *</Label>
                <Input
                  type="number"
                  {...register('level', { valueAsNumber: true })}
                  placeholder="0"
                  min="0"
                />
                {errors.level && (
                  <p className="text-sm text-red-500">{errors.level.message}</p>
                )}
              </div>
            </div>

            {/* Requirements */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Gereksinimler</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Min. Harcama (₺)</Label>
                  <Input
                    type="number"
                    {...register('minTotalSpent', { valueAsNumber: true })}
                    placeholder="1000"
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Min. Ziyaret</Label>
                  <Input
                    type="number"
                    {...register('minVisitCount', { valueAsNumber: true })}
                    placeholder="10"
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Min. Puan</Label>
                  <Input
                    type="number"
                    {...register('minPoints', { valueAsNumber: true })}
                    placeholder="500"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Faydalar</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Puan Çarpanı</Label>
                  <Input
                    type="number"
                    step="0.1"
                    {...register('pointMultiplier', { valueAsNumber: true })}
                    placeholder="1.0"
                    min="0.1"
                    max="10"
                  />
                  {errors.pointMultiplier && (
                    <p className="text-sm text-red-500">{errors.pointMultiplier.message}</p>
                  )}
                  <p className="text-xs text-gray-500">Genel oran × {watch('pointMultiplier') || 1.0}x = Kazanılan puan</p>
                </div>

                <div className="space-y-2">
                  <Label>İndirim Oranı (%)</Label>
                  <Input
                    type="number"
                    {...register('discountPercent', { valueAsNumber: true })}
                    placeholder="10"
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-gray-500">Varsayılan indirim</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Özel Avantajlar</Label>
                <textarea
                  {...register('specialFeatures')}
                  className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="Bu seviyeye özel avantajları listeleyin... Örn:&#10;• Ücretsiz kargo&#10;• VIP müşteri hizmetleri&#10;• Özel etkinliklere davet"
                  rows={3}
                />
                <p className="text-xs text-gray-500">Her satıra bir avantaj yazın. Müşteri uygulamasında görüntülenecektir.</p>
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Switch
                checked={watch('isActive')}
                onCheckedChange={(checked) => setValue('isActive', checked)}
              />
              <Label>Tier aktif</Label>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                disabled={formLoading}
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={formLoading}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {formLoading ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    {editingTier ? 'Güncelleniyor...' : 'Oluşturuluyor...'}
                  </div>
                ) : (
                  editingTier ? 'Tier Güncelle' : 'Tier Oluştur'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}