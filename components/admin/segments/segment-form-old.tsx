'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { Segment } from '@prisma/client'
import { SegmentCriteriaForm } from './segment-criteria-form'
import { SegmentCriteria } from '@/lib/segment-analyzer'

const segmentSchema = z.object({
  name: z.string().min(2, 'Segment adı en az 2 karakter olmalıdır'),
  description: z.string().optional(),
  rules: z.string().optional(),
  isAutomatic: z.boolean().default(false),
  criteria: z.string().optional()
})

type SegmentFormData = z.infer<typeof segmentSchema>

interface SegmentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  segment?: Segment | null
  onSubmit: (data: SegmentFormData) => Promise<void>
  isLoading?: boolean
}

type ExtendedSegment = Segment
export function SegmentForm({ 
  open, 
  onOpenChange, 
  segment, 
  onSubmit, 
  isLoading 
}: SegmentFormProps) {
  const [segmentCriteria, setSegmentCriteria] = useState<SegmentCriteria | null>(null)
  const [isAutomatic, setIsAutomatic] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<SegmentFormData>({
    resolver: zodResolver(segmentSchema),
    defaultValues: {
      name: segment?.name || '',
      description: segment?.description || '',
      rules: segment?.rules || '',
      isAutomatic: (segment as ExtendedSegment)?.isAutomatic || false,
      criteria: segment?.criteria || ''
    }
  })

  useEffect(() => {
    if (segment) {
      const extSegment = segment as ExtendedSegment
      
      // Form değerlerini güncelle
      reset({
        name: segment.name || '',
        description: segment.description || '',
        rules: segment.rules || '',
        isAutomatic: extSegment.isAutomatic || false,
        criteria: extSegment.criteria || ''
      })
      
      if (extSegment.criteria) {
        try {
          setSegmentCriteria(JSON.parse(extSegment.criteria))
          setIsAutomatic(extSegment.isAutomatic || false)
          if (extSegment.isAutomatic) {
            setActiveTab('criteria')
          }
        } catch (error) {
          console.error('Error parsing criteria:', error)
        }
      }
    } else {
      reset({
        name: '',
        description: '',
        rules: '',
        isAutomatic: false,
        criteria: ''
      })
      setSegmentCriteria(null)
      setIsAutomatic(false)
      setActiveTab('basic')
    }
  }, [segment, reset])

  const handleFormSubmit = async (data: SegmentFormData) => {
    const submitData = {
      ...data,
      isAutomatic,
      criteria: isAutomatic && segmentCriteria ? JSON.stringify(segmentCriteria) : undefined
    }
    await onSubmit(submitData)
    reset()
    setSegmentCriteria(null)
    setIsAutomatic(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {segment ? 'Segment Düzenle' : 'Yeni Segment Oluştur'}
          </DialogTitle>
          <DialogDescription>
            {segment 
              ? 'Segment bilgilerini güncelleyin.' 
              : 'Yeni müşteri segmenti oluşturun.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Temel Bilgiler</TabsTrigger>
            <TabsTrigger value="criteria">Segment Kriterleri</TabsTrigger>
          </TabsList>
          
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Segment Adı *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Örn: VIP Müşteriler"
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Segment hakkında açıklama yazın..."
                  rows={3}
                />
              </div>

              {!isAutomatic && (
                <div className="space-y-2">
                  <Label htmlFor="rules">Manuel Segment Kuralları</Label>
                  <Textarea
                    id="rules"
                    {...register('rules')}
                    placeholder="Örn: Aylık harcama > 500 TL, Son ziyaret < 30 gün"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">
                    Manuel segmentler için açıklayıcı kurallar yazabilirsiniz
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="criteria" className="mt-4">
              <SegmentCriteriaForm
                criteria={segmentCriteria}
                onCriteriaChange={setSegmentCriteria}
                isAutomatic={isAutomatic}
                onAutomaticChange={setIsAutomatic}
              />
            </TabsContent>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                İptal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {segment ? 'Güncelle' : 'Oluştur'}
              </Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}