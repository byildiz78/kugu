'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  Award,
  Star,
  Users,
  CreditCard,
  Gift
} from 'lucide-react'
import { Customer, CustomerLevel } from '@prisma/client'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

const customerSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir email adresi giriniz'),
  phone: z.string().optional(),
  birthDate: z.string().optional()
})

type CustomerFormData = z.infer<typeof customerSchema>

interface CustomerFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: Customer | null
  onSubmit: (data: CustomerFormData) => Promise<void>
  isLoading?: boolean
}

const levelOptions = [
  { 
    value: 'REGULAR', 
    label: 'Normal', 
    color: 'bg-gray-100 text-gray-800',
    gradient: 'from-gray-400 to-gray-500',
    icon: Users,
    description: 'Standart müşteri'
  },
  { 
    value: 'BRONZE', 
    label: 'Bronz', 
    color: 'bg-amber-100 text-amber-800',
    gradient: 'from-amber-400 to-orange-500',
    icon: Award,
    description: 'Bronz seviye müşteri'
  },
  { 
    value: 'SILVER', 
    label: 'Gümüş', 
    color: 'bg-slate-100 text-slate-800',
    gradient: 'from-slate-400 to-slate-500',
    icon: Award,
    description: 'Gümüş seviye müşteri'
  },
  { 
    value: 'GOLD', 
    label: 'Altın', 
    color: 'bg-yellow-100 text-yellow-800',
    gradient: 'from-yellow-400 to-yellow-600',
    icon: Award,
    description: 'Altın seviye müşteri'
  },
  { 
    value: 'PLATINUM', 
    label: 'Platin', 
    color: 'bg-purple-100 text-purple-800',
    gradient: 'from-purple-400 to-purple-600',
    icon: Star,
    description: 'En üst seviye müşteri'
  }
]

export function CustomerForm({ open, onOpenChange, customer, onSubmit, isLoading }: CustomerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer?.name || '',
      email: customer?.email || '',
      phone: customer?.phone || '',
      birthDate: customer?.birthDate ? (customer.birthDate instanceof Date ? customer.birthDate.toISOString().split('T')[0] : customer.birthDate.split('T')[0]) : ''
    }
  })

  const selectedLevel = customer?.level || 'REGULAR'
  const selectedLevelData = levelOptions.find(opt => opt.value === selectedLevel)
  const watchedName = watch('name')

  // Update form when customer changes
  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        birthDate: customer.birthDate ? (customer.birthDate instanceof Date ? customer.birthDate.toISOString().split('T')[0] : customer.birthDate.split('T')[0]) : ''
      })
    } else {
      reset({
        name: '',
        email: '',
        phone: '',
        birthDate: ''
      })
    }
  }, [customer, reset])

  const handleFormSubmit = async (data: CustomerFormData) => {
    await onSubmit(data)
    if (!customer) {
      reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        {/* Header with Customer Preview */}
        <div className={`p-6 -m-6 mb-6 bg-gradient-to-r ${selectedLevelData?.gradient || 'from-blue-500 to-purple-500'}`}>
          <div className="flex items-center gap-4 text-white">
            <Avatar className="h-16 w-16 border-4 border-white/20">
              <AvatarFallback className="bg-white/20 text-white font-bold text-lg">
                {watchedName ? watchedName.split(' ').map(n => n[0]).join('').toUpperCase() : customer?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'YM'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">
                {customer ? 'Müşteri Düzenle' : 'Yeni Müşteri Ekle'}
              </h2>
              <p className="text-white/80 text-sm">
                {watchedName || customer?.name || 'Müşteri Adı'}
              </p>
              {customer && selectedLevelData && (
                <Badge className={`mt-2 ${selectedLevelData.color}`}>
                  {React.createElement(selectedLevelData.icon, { className: "h-3 w-3 mr-1" })}
                  {selectedLevelData.label}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Kişisel Bilgiler */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-blue-600" />
                Kişisel Bilgiler
              </CardTitle>
              <CardDescription>
                Müşterinin temel bilgilerini girin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    Ad Soyad *
                  </Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Müşteri adı soyadı"
                    className="h-11"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="ornek@email.com"
                      className="h-11"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      Telefon
                    </Label>
                    <Input
                      id="phone"
                      {...register('phone')}
                      placeholder="0555 123 45 67"
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    Doğum Tarihi
                  </Label>
                  <Input
                    id="birthDate"
                    type="date"
                    {...register('birthDate')}
                    className="h-11"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Müşteri Seviyesi - Read Only */}
          {customer && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Award className="h-5 w-5 text-amber-600" />
                  Müşteri Seviyesi
                </CardTitle>
                <CardDescription>
                  Müşteri seviyesi otomatik olarak belirlenir
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="level" className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-gray-500" />
                    Mevcut Seviye
                  </Label>
                  <div className="h-11 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md flex items-center justify-between">
                    {selectedLevelData && (
                      <div className="flex items-center gap-2">
                        {React.createElement(selectedLevelData.icon, { className: "h-4 w-4" })}
                        <span>{selectedLevelData.label}</span>
                        <Badge className={`ml-2 ${selectedLevelData.color}`}>
                          Otomatik
                        </Badge>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Müşteri seviyesi, harcama miktarı ve ziyaret sayısına göre otomatik olarak güncellenir.
                  </p>
                </div>

                {/* Customer Stats */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Müşteri İstatistikleri</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Kayıt Tarihi:</span>
                      <div className="font-medium">{format(new Date(customer.createdAt), 'dd MMMM yyyy', { locale: tr })}</div>
                    </div>
                    {customer.lastVisit && (
                      <div>
                        <span className="text-gray-500">Son Ziyaret:</span>
                        <div className="font-medium">{format(new Date(customer.lastVisit), 'dd MMMM yyyy', { locale: tr })}</div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 px-6"
            >
              İptal
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="h-11 px-6 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {customer ? 'Güncelle' : 'Ekle'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}