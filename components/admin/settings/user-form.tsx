'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  User, 
  Mail, 
  Lock, 
  Shield, 
  Building, 
  Eye, 
  EyeOff,
  Crown,
  UserCheck,
  Upload,
  Image as ImageIcon
} from 'lucide-react'
import { User as PrismaUser, Role } from '@prisma/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

interface UserWithDetails extends PrismaUser {
  restaurant?: { 
    name: string 
  }
}

interface UserFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => Promise<void>
  user?: UserWithDetails | null
  isLoading: boolean
}

const userSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir email adresi giriniz'),
  password: z.string().optional(),
  role: z.enum(['ADMIN', 'RESTAURANT_ADMIN', 'STAFF', 'CLIENT']),
  restaurantId: z.string().optional()
})

type UserFormData = z.infer<typeof userSchema>

const roleLabels = {
  ADMIN: 'Sistem Yöneticisi',
  RESTAURANT_ADMIN: 'Restoran Yöneticisi',
  STAFF: 'Personel',
  CLIENT: 'Müşteri'
}

const roleDescriptions = {
  ADMIN: 'Tüm sistem yetkilerine sahip',
  RESTAURANT_ADMIN: 'Restoran yönetimi yetkisi',
  STAFF: 'Çalışan düzeyinde yetki',
  CLIENT: 'Temel müşteri yetkisi'
}

const roleIcons = {
  ADMIN: Crown,
  RESTAURANT_ADMIN: Building,
  STAFF: UserCheck,
  CLIENT: User
}

export function UserForm({ open, onOpenChange, onSubmit, user, isLoading }: UserFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [restaurants, setRestaurants] = useState<Array<{ id: string; name: string }>>([])
  const [loadingRestaurants, setLoadingRestaurants] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'CLIENT',
      restaurantId: ''
    }
  })

  const watchedRole = watch('role')
  const watchedName = watch('name')
  const watchedEmail = watch('email')

  // Fetch restaurants for restaurant selection
  const fetchRestaurants = async () => {
    try {
      setLoadingRestaurants(true)
      const response = await fetch('/api/restaurants')
      if (!response.ok) throw new Error('Failed to fetch restaurants')
      
      const data = await response.json()
      setRestaurants(data.restaurants || [])
    } catch (error) {
      console.error('Error fetching restaurants:', error)
      toast.error('Restoranlar yüklenirken hata oluştu')
    } finally {
      setLoadingRestaurants(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchRestaurants()
      
      if (user) {
        // Edit mode - populate form with user data
        reset({
          name: user.name || '',
          email: user.email,
          password: '', // Don't populate password for security
          role: user.role,
          restaurantId: user.restaurantId || ''
        })
      } else {
        // Create mode - reset form
        reset({
          name: '',
          email: '',
          password: '',
          role: 'CLIENT',
          restaurantId: ''
        })
      }
    }
  }, [open, user, reset])

  const handleFormSubmit = async (data: UserFormData) => {
    try {
      // Don't send empty password for updates
      const submitData = { ...data }
      if (user && !data.password) {
        delete submitData.password
      }
      
      // Don't send restaurantId if not needed
      if (!['RESTAURANT_ADMIN', 'STAFF'].includes(data.role)) {
        delete submitData.restaurantId
      }
      
      await onSubmit(submitData)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const getRoleIcon = (role: Role) => {
    const Icon = roleIcons[role]
    return <Icon className="h-4 w-4" />
  }

  const generateAvatarUrl = (name: string, email: string) => {
    if (!name && !email) return ''
    const text = name || email
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(text)}&background=random&color=fff&size=100`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {user ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Oluştur'}
              </DialogTitle>
              <DialogDescription>
                {user ? 'Kullanıcı bilgilerini güncelleyin' : 'Sisteme yeni kullanıcı ekleyin'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Avatar Preview */}
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-gray-100">
                <AvatarImage 
                  src={user?.image || generateAvatarUrl(watchedName, watchedEmail)} 
                />
                <AvatarFallback className="text-lg font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                  {(watchedName || watchedEmail || 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 bg-white shadow-md"
                disabled
              >
                <ImageIcon className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Ad Soyad
                </Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Kullanıcının tam adını giriniz"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Adresi
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="kullanici@example.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  {user ? 'Yeni Şifre (isteğe bağlı)' : 'Şifre'}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    placeholder={user ? 'Değiştirmek için yeni şifre giriniz' : 'Güvenli bir şifre oluşturunuz'}
                    className={`pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
                {!user && (
                  <p className="text-xs text-gray-500">
                    En az 8 karakter, büyük harf, küçük harf ve rakam içermeli
                  </p>
                )}
              </div>
            </div>

            {/* Role and Permissions */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Kullanıcı Rolü
                </Label>
                <Select
                  value={watchedRole}
                  onValueChange={(value: Role) => setValue('role', value)}
                >
                  <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleLabels).map(([role, label]) => (
                      <SelectItem key={role} value={role}>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(role as Role)}
                          <div>
                            <div className="font-medium">{label}</div>
                            <div className="text-xs text-gray-500">
                              {roleDescriptions[role as Role]}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-sm text-red-500">{errors.role.message}</p>
                )}
              </div>

              {/* Restaurant Selection (only for RESTAURANT_ADMIN and STAFF) */}
              {(['RESTAURANT_ADMIN', 'STAFF'].includes(watchedRole)) && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Restoran
                  </Label>
                  <Select
                    value={watch('restaurantId') || ''}
                    onValueChange={(value) => setValue('restaurantId', value)}
                    disabled={loadingRestaurants}
                  >
                    <SelectTrigger className={errors.restaurantId ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Restoran seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      {restaurants.map((restaurant) => (
                        <SelectItem key={restaurant.id} value={restaurant.id}>
                          {restaurant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.restaurantId && (
                    <p className="text-sm text-red-500">{errors.restaurantId.message}</p>
                  )}
                </div>
              )}

              {/* Role Information Card */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {getRoleIcon(watchedRole)}
                  <span className="font-medium text-sm">{roleLabels[watchedRole]}</span>
                </div>
                <p className="text-xs text-gray-600">
                  {roleDescriptions[watchedRole]}
                </p>
                
                {watchedRole === 'ADMIN' && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    ⚠️ Bu rol tüm sistem yetkilerine sahiptir. Dikkatli kullanınız.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {user ? 'Güncelleniyor...' : 'Oluşturuluyor...'}
                </div>
              ) : (
                user ? 'Kullanıcıyı Güncelle' : 'Kullanıcı Oluştur'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}