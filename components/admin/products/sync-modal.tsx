'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface SyncResult {
  totalReceived: number
  inserted: number
  updated: number
  errors: number
}

interface SyncStep {
  id: string
  title: string
  status: 'pending' | 'in_progress' | 'completed' | 'error'
  message?: string
}

interface SyncModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

export function SyncModal({ open, onOpenChange, onComplete }: SyncModalProps) {
  const [syncing, setSyncing] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [result, setResult] = useState<SyncResult | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  const [steps, setSteps] = useState<SyncStep[]>([
    { id: 'validate', title: 'POS ayarları kontrol ediliyor', status: 'pending' },
    { id: 'connect', title: 'POS API\'ye bağlanılıyor', status: 'pending' },
    { id: 'fetch', title: 'Ürün verileri alınıyor', status: 'pending' },
    { id: 'process', title: 'Ürünler işleniyor', status: 'pending' },
    { id: 'complete', title: 'Senkronizasyon tamamlandı', status: 'pending' }
  ])

  const updateStep = (stepIndex: number, status: SyncStep['status'], message?: string) => {
    setSteps(prev => prev.map((step, index) =>
      index === stepIndex ? { ...step, status, message } : step
    ))
  }

  const handleSync = async () => {
    try {
      setSyncing(true)
      setCurrentStep(0)
      setResult(null)
      setErrors([])

      // Reset all steps
      setSteps(prev => prev.map(step => ({ ...step, status: 'pending', message: undefined })))

      // Step 1: Validate settings
      updateStep(0, 'in_progress')
      await new Promise(resolve => setTimeout(resolve, 500)) // Visual delay

      const response = await fetch('/api/products/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const errorData = await response.json()

        if (response.status === 400 && errorData.message?.includes('POS API ayarları')) {
          updateStep(0, 'error', 'POS ayarları eksik veya hatalı')
          throw new Error(errorData.message)
        }

        if (response.status === 400 && errorData.message?.includes('JSON formatında')) {
          updateStep(0, 'error', 'API sorgusu geçersiz JSON formatında')
          throw new Error(errorData.message)
        }

        updateStep(0, 'error', 'Ayar doğrulama başarısız')
        throw new Error(errorData.message || 'Senkronizasyon başarısız')
      }

      updateStep(0, 'completed', 'POS ayarları doğrulandı')
      setCurrentStep(1)

      // Step 2: Connect to API
      updateStep(1, 'in_progress')
      await new Promise(resolve => setTimeout(resolve, 300))
      updateStep(1, 'completed', 'POS API bağlantısı başarılı')
      setCurrentStep(2)

      // Step 3: Fetch data
      updateStep(2, 'in_progress')
      await new Promise(resolve => setTimeout(resolve, 500))
      updateStep(2, 'completed', 'Ürün verileri alındı')
      setCurrentStep(3)

      // Step 4: Process products
      updateStep(3, 'in_progress')

      const syncResult = await response.json()

      if (!syncResult.success) {
        updateStep(3, 'error', 'Ürün işleme başarısız')
        throw new Error(syncResult.message || 'Ürün işleme hatası')
      }

      updateStep(3, 'completed', `${syncResult.summary.totalReceived} ürün işlendi`)
      setCurrentStep(4)

      // Step 5: Complete
      updateStep(4, 'completed', 'Tüm işlemler tamamlandı')

      setResult(syncResult.summary)

      if (syncResult.errors && syncResult.errors.length > 0) {
        setErrors(syncResult.errors)
      }

      toast.success(`Senkronizasyon tamamlandı: ${syncResult.summary.inserted} yeni, ${syncResult.summary.updated} güncellendi`)

      // Auto close after success
      setTimeout(() => {
        onComplete()
        onOpenChange(false)
      }, 2000)

    } catch (error) {
      console.error('Sync error:', error)
      toast.error(error instanceof Error ? error.message : 'Senkronizasyon sırasında hata oluştu')
    } finally {
      setSyncing(false)
    }
  }

  const handleClose = () => {
    if (!syncing) {
      onOpenChange(false)
    }
  }

  const getStepIcon = (step: SyncStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'in_progress':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
    }
  }

  const progressValue = ((currentStep + 1) / steps.length) * 100

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Ürün Senkronizasyonu
          </DialogTitle>
          <DialogDescription>
            POS sisteminden ürün verilerini alıp veritabanınızla senkronize ediliyor
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>İlerleme</span>
              <span>{Math.round(progressValue)}%</span>
            </div>
            <Progress value={progressValue} className="w-full" />
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${
                  step.status === 'in_progress' ? 'bg-blue-50' :
                  step.status === 'error' ? 'bg-red-50' :
                  step.status === 'completed' ? 'bg-green-50' : 'bg-gray-50'
                }`}
              >
                {getStepIcon(step)}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    step.status === 'error' ? 'text-red-700' :
                    step.status === 'completed' ? 'text-green-700' :
                    step.status === 'in_progress' ? 'text-blue-700' : 'text-gray-700'
                  }`}>
                    {step.title}
                  </p>
                  {step.message && (
                    <p className={`text-xs mt-1 ${
                      step.status === 'error' ? 'text-red-600' :
                      step.status === 'completed' ? 'text-green-600' :
                      'text-gray-600'
                    }`}>
                      {step.message}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Results */}
          {result && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2">Senkronizasyon Sonuçları</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Toplam Ürün: <span className="font-medium">{result.totalReceived}</span></div>
                <div>Yeni Eklenen: <span className="font-medium text-green-600">{result.inserted}</span></div>
                <div>Güncellenen: <span className="font-medium text-blue-600">{result.updated}</span></div>
                <div>Hata: <span className="font-medium text-red-600">{result.errors}</span></div>
              </div>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <h4 className="font-medium text-yellow-900">Uyarılar ({errors.length})</h4>
              </div>
              <div className="max-h-32 overflow-y-auto">
                {errors.slice(0, 3).map((error, index) => (
                  <p key={index} className="text-xs text-yellow-800 mb-1">{error}</p>
                ))}
                {errors.length > 3 && (
                  <p className="text-xs text-yellow-600">... ve {errors.length - 3} tane daha</p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={syncing}
            >
              {syncing ? 'İşlem Devam Ediyor...' : 'Kapat'}
            </Button>
            {!result && (
              <Button
                onClick={handleSync}
                disabled={syncing}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              >
                {syncing ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Senkronize Ediliyor...
                  </div>
                ) : (
                  'Senkronizasyonu Başlat'
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}