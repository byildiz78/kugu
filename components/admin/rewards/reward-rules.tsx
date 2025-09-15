'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { 
  Plus, 
  Target, 
  MoreHorizontal,
  Edit,
  Trash2,
  TrendingUp,
  Users,
  Star,
  Calendar,
  Gift,
  Zap,
  Trophy
} from 'lucide-react'
import { RewardRule, TriggerType } from '@prisma/client'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

interface RewardRuleWithDetails extends RewardRule {
  reward: {
    name: string
    type: string
  }
}

interface RewardRulesProps {
  rewardId: string
  rules: RewardRuleWithDetails[]
  onRulesChange: () => void
}

const ruleSchema = z.object({
  triggerType: z.enum(['VISIT_COUNT', 'TOTAL_SPENT', 'POINTS_MILESTONE', 'TIER_REACHED', 'CONSECUTIVE_VISITS', 'CATEGORY_PURCHASE', 'FIRST_PURCHASE', 'BIRTHDAY', 'ANNIVERSARY']),
  triggerValue: z.number().min(1, 'Değer 1\'den büyük olmalıdır'),
  periodType: z.string().optional(),
  categoryFilter: z.string().optional(),
  timeRestriction: z.string().optional(),
  isActive: z.boolean().default(true)
})

type RuleFormData = z.infer<typeof ruleSchema>

const triggerTypeLabels = {
  VISIT_COUNT: 'Ziyaret Sayısı',
  TOTAL_SPENT: 'Toplam Harcama',
  POINTS_MILESTONE: 'Puan Aşaması',
  TIER_REACHED: 'Seviye Ulaşımı',
  CONSECUTIVE_VISITS: 'Ardışık Ziyaret',
  CATEGORY_PURCHASE: 'Kategori Alışverişi',
  FIRST_PURCHASE: 'İlk Alışveriş',
  BIRTHDAY: 'Doğum Günü',
  ANNIVERSARY: 'Yıldönümü'
}

const triggerTypeIcons = {
  VISIT_COUNT: Users,
  TOTAL_SPENT: TrendingUp,
  POINTS_MILESTONE: Star,
  TIER_REACHED: Trophy,
  CONSECUTIVE_VISITS: Target,
  CATEGORY_PURCHASE: Gift,
  FIRST_PURCHASE: Zap,
  BIRTHDAY: Calendar,
  ANNIVERSARY: Calendar
}

const triggerTypeColors = {
  VISIT_COUNT: 'bg-blue-100 text-blue-800 border-blue-200',
  TOTAL_SPENT: 'bg-green-100 text-green-800 border-green-200',
  POINTS_MILESTONE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  TIER_REACHED: 'bg-purple-100 text-purple-800 border-purple-200',
  CONSECUTIVE_VISITS: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  CATEGORY_PURCHASE: 'bg-pink-100 text-pink-800 border-pink-200',
  FIRST_PURCHASE: 'bg-orange-100 text-orange-800 border-orange-200',
  BIRTHDAY: 'bg-red-100 text-red-800 border-red-200',
  ANNIVERSARY: 'bg-teal-100 text-teal-800 border-teal-200'
}

export function RewardRules({ rewardId, rules, onRulesChange }: RewardRulesProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [editingRule, setEditingRule] = useState<RewardRuleWithDetails | null>(null)
  const [availableTiers, setAvailableTiers] = useState<any[]>([])
  const [tiersLoading, setTiersLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<RuleFormData>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      triggerType: 'VISIT_COUNT',
      triggerValue: 1,
      periodType: 'LIFETIME',
      isActive: true
    }
  })

  const watchedTriggerType = watch('triggerType')

  const fetchTiers = async () => {
    try {
      setTiersLoading(true)
      const response = await fetch('/api/tiers')
      if (response.ok) {
        const data = await response.json()
        setAvailableTiers(data.tiers)
      }
    } catch (error) {
      console.error('Error fetching tiers:', error)
    } finally {
      setTiersLoading(false)
    }
  }

  useEffect(() => {
    fetchTiers()
  }, [])

  useEffect(() => {
    if (formOpen) {
      if (editingRule) {
        // Edit mode
        reset({
          triggerType: editingRule.triggerType as any,
          triggerValue: editingRule.triggerValue,
          periodType: editingRule.periodType || 'LIFETIME',
          categoryFilter: editingRule.categoryFilter || '',
          timeRestriction: editingRule.timeRestriction || '',
          isActive: editingRule.isActive
        })
      } else {
        // Create mode
        reset({
          triggerType: 'VISIT_COUNT',
          triggerValue: 1,
          periodType: 'LIFETIME',
          categoryFilter: '',
          timeRestriction: '',
          isActive: true
        })
      }
    }
  }, [formOpen, editingRule, reset])

  const handleCreateRule = async (data: RuleFormData) => {
    try {
      setFormLoading(true)
      const response = await fetch('/api/reward-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, rewardId })
      })

      if (!response.ok) throw new Error('Failed to create rule')
      
      toast.success('Kural başarıyla oluşturuldu')
      setFormOpen(false)
      onRulesChange()
    } catch (error) {
      console.error('Error creating rule:', error)
      toast.error('Kural oluşturulurken hata oluştu')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateRule = async (data: RuleFormData) => {
    if (!editingRule) return

    try {
      setFormLoading(true)
      const response = await fetch(`/api/reward-rules/${editingRule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error('Failed to update rule')
      
      toast.success('Kural başarıyla güncellendi')
      setFormOpen(false)
      setEditingRule(null)
      onRulesChange()
    } catch (error) {
      console.error('Error updating rule:', error)
      toast.error('Kural güncellenirken hata oluştu')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteRule = async (rule: RewardRuleWithDetails) => {
    if (!confirm('Bu kuralı silmek istediğinizden emin misiniz?')) return

    try {
      const response = await fetch(`/api/reward-rules/${rule.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete rule')
      
      toast.success('Kural başarıyla silindi')
      onRulesChange()
    } catch (error) {
      console.error('Error deleting rule:', error)
      toast.error('Kural silinirken hata oluştu')
    }
  }

  const handleToggleStatus = async (rule: RewardRuleWithDetails) => {
    try {
      const response = await fetch(`/api/reward-rules/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rule, isActive: !rule.isActive })
      })

      if (!response.ok) throw new Error('Failed to toggle rule status')
      
      toast.success(`Kural ${!rule.isActive ? 'aktif' : 'pasif'} hale getirildi`)
      onRulesChange()
    } catch (error) {
      console.error('Error toggling rule status:', error)
      toast.error('Kural durumu değiştirilirken hata oluştu')
    }
  }

  const handleEdit = (rule: RewardRuleWithDetails) => {
    setEditingRule(rule)
    setFormOpen(true)
  }

  const getTierLabel = (tierId: string) => {
    const tier = availableTiers.find(t => t.id === tierId)
    return tier ? tier.displayName : `Tier ID: ${tierId}`
  }

  const getTriggerValueLabel = (type: TriggerType, value: number) => {
    switch (type) {
      case 'VISIT_COUNT':
        return `${value}. ziyaret`
      case 'TOTAL_SPENT':
        return `${value}₺ harcama`
      case 'POINTS_MILESTONE':
        return `${value} puan`
      case 'TIER_REACHED':
        // For legacy rules with numeric values, try to match with available tiers
        const legacyTiers = ['Regular', 'Bronze', 'Silver', 'Gold', 'Platinum']
        if (value < legacyTiers.length) {
          return legacyTiers[value]
        }
        // For new tier system, find tier by level
        const tier = availableTiers.find(t => t.level === value)
        return tier ? tier.displayName : `Level ${value}`
      case 'CONSECUTIVE_VISITS':
        return `${value} ardışık ziyaret`
      default:
        return value.toString()
    }
  }

  const renderTriggerValueInput = () => {
    switch (watchedTriggerType) {
      case 'TIER_REACHED':
        return (
          <Select
            value={watch('triggerValue')?.toString()}
            onValueChange={(value) => setValue('triggerValue', parseInt(value))}
            disabled={tiersLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={tiersLoading ? "Yükleniyor..." : "Seviye seçin"} />
            </SelectTrigger>
            <SelectContent>
              {availableTiers.map((tier) => (
                <SelectItem key={tier.id} value={tier.level.toString()}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: tier.color }}
                    />
                    {tier.displayName} (Level {tier.level})
                  </div>
                </SelectItem>
              ))}
              {availableTiers.length === 0 && !tiersLoading && (
                <SelectItem value="-1" disabled>
                  Henüz tier tanımlanmamış
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        )
      
      case 'TOTAL_SPENT':
        return (
          <div className="relative">
            <Input
              type="number"
              {...register('triggerValue', { valueAsNumber: true })}
              placeholder="1000"
              className="pr-8"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              ₺
            </span>
          </div>
        )
      
      default:
        return (
          <Input
            type="number"
            {...register('triggerValue', { valueAsNumber: true })}
            placeholder="1"
          />
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Ödül Kuralları
            </CardTitle>
            <CardDescription>
              Bu ödülün ne zaman verileceğini belirleyen kuralları yönetin
            </CardDescription>
          </div>
          <Button 
            onClick={() => setFormOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Kural
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {rules.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Henüz kural tanımlanmamış</p>
            <p className="text-sm text-gray-400">
              Bu ödülün otomatik olarak verilmesi için kurallar ekleyin
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {rules.map((rule) => {
              const TriggerIcon = triggerTypeIcons[rule.triggerType as keyof typeof triggerTypeIcons]
              
              return (
                <div
                  key={rule.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  {/* Trigger Type */}
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <TriggerIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <Badge className={`text-xs border ${triggerTypeColors[rule.triggerType as keyof typeof triggerTypeColors]}`}>
                        {triggerTypeLabels[rule.triggerType as keyof typeof triggerTypeLabels]}
                      </Badge>
                      <div className="text-sm text-gray-600 mt-1">
                        {getTriggerValueLabel(rule.triggerType, rule.triggerValue)}
                      </div>
                    </div>
                  </div>

                  {/* Period */}
                  {rule.periodType && rule.periodType !== 'LIFETIME' && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                      <Calendar className="h-3 w-3" />
                      {rule.periodType === 'MONTHLY' ? 'Aylık' : 
                       rule.periodType === 'WEEKLY' ? 'Haftalık' : rule.periodType}
                    </div>
                  )}

                  {/* Status */}
                  <div className="flex items-center gap-2 ml-auto">
                    <Switch
                      checked={rule.isActive}
                      onCheckedChange={() => handleToggleStatus(rule)}
                    />
                    <span className={`text-sm ${rule.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                      {rule.isActive ? 'Aktif' : 'Pasif'}
                    </span>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(rule)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteRule(rule)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      {/* Rule Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Kuralı Düzenle' : 'Yeni Kural Oluştur'}
            </DialogTitle>
            <DialogDescription>
              Ödülün ne zaman verileceğini belirleyen koşulları tanımlayın
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(editingRule ? handleUpdateRule : handleCreateRule)} className="space-y-4">
            {/* Trigger Type */}
            <div className="space-y-2">
              <Label>Tetikleyici Türü</Label>
              <Select
                value={watchedTriggerType}
                onValueChange={(value) => setValue('triggerType', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(triggerTypeLabels).map(([value, label]) => {
                    const Icon = triggerTypeIcons[value as keyof typeof triggerTypeIcons]
                    return (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              {errors.triggerType && (
                <p className="text-sm text-red-500">{errors.triggerType.message}</p>
              )}
            </div>

            {/* Trigger Value */}
            <div className="space-y-2">
              <Label>Değer</Label>
              {renderTriggerValueInput()}
              {errors.triggerValue && (
                <p className="text-sm text-red-500">{errors.triggerValue.message}</p>
              )}
            </div>

            {/* Period Type */}
            <div className="space-y-2">
              <Label>Periyot</Label>
              <Select
                value={watch('periodType') || 'LIFETIME'}
                onValueChange={(value) => setValue('periodType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LIFETIME">Yaşam Boyu</SelectItem>
                  <SelectItem value="MONTHLY">Aylık</SelectItem>
                  <SelectItem value="WEEKLY">Haftalık</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Switch
                checked={watch('isActive')}
                onCheckedChange={(checked) => setValue('isActive', checked)}
              />
              <Label>Kural aktif</Label>
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
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {formLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {editingRule ? 'Güncelleniyor...' : 'Oluşturuluyor...'}
                  </div>
                ) : (
                  editingRule ? 'Kuralı Güncelle' : 'Kural Oluştur'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}