'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Coins, Save, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

interface SettingsData {
  basePointRate: number
}

const settingsSchema = z.object({
  basePointRate: z.number().min(0.01, 'Minimum 0.01 olmalıdır').max(10, 'Maximum 10 olmalıdır')
})

type SettingsFormData = z.infer<typeof settingsSchema>

export function PointSystem() {
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty }
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      basePointRate: 0.1
    }
  })

  const watchedBasePointRate = watch('basePointRate')

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings')
      if (!response.ok) throw new Error('Failed to fetch settings')
      
      const data = await response.json()
      setSettings(data.settings)
      reset({
        basePointRate: data.settings.basePointRate
      })
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Ayarlar yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSaveSettings = async (data: SettingsFormData) => {
    try {
      setSaving(true)
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error('Failed to save settings')
      
      const result = await response.json()
      setSettings(result.settings)
      reset(data) // Reset form state to mark as not dirty
      toast.success('Ayarlar başarıyla kaydedildi')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Ayarlar kaydedilirken hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  // Calculate example scenarios
  const getExampleScenarios = (rate: number) => {
    const scenarios = [
      { amount: 10, points: Math.floor(10 * rate) },
      { amount: 50, points: Math.floor(50 * rate) },
      { amount: 100, points: Math.floor(100 * rate) },
      { amount: 500, points: Math.floor(500 * rate) }
    ]
    return scenarios
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Puan Sistemi Ayarları
        </CardTitle>
        <CardDescription>
          Müşterilerin puan kazanma oranlarını ayarlayın
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleSaveSettings)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Varsayılan Puan Oranı (TL başına puan)</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register('basePointRate', { valueAsNumber: true })}
                  placeholder="0.1"
                  min="0.01"
                  max="10"
                />
                {errors.basePointRate && (
                  <p className="text-sm text-red-500">{errors.basePointRate.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  Bu oran tier çarpanları ile birlikte kullanılır
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Nasıl Çalışır?</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• Müşteri alışveriş yapar: 100₺</p>
                  <p>• Tier puan oranı: 2.0x (örn: Gold tier)</p>
                  <p>• Kazanılan puan: 100 × {watchedBasePointRate || 0.1} × 2.0 = {Math.floor(100 * (watchedBasePointRate || 0.1) * 2.0)} puan</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Örnek Senaryolar</h4>
              <div className="space-y-3">
                {getExampleScenarios(watchedBasePointRate || 0.1).map((scenario, index) => (
                  <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-md">
                    <span className="text-sm">{scenario.amount}₺ alışveriş</span>
                    <span className="font-medium text-green-600">{scenario.points} puan</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                * Tier çarpanı 1.0x ile hesaplanmıştır
              </p>
            </div>
          </div>

          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {isDirty ? (
                <span className="text-orange-600">⚠️ Kaydedilmemiş değişiklikler var</span>
              ) : (
                <span className="text-green-600">✅ Tüm değişiklikler kaydedildi</span>
              )}
            </div>
            
            <Button
              type="submit"
              disabled={!isDirty || saving}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Kaydediliyor...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Ayarları Kaydet
                </div>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}