'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MobileContainer } from '@/components/mobile/layout/MobileContainer'
import { ThemedCard } from '@/components/mobile/ui/ThemedCard'
import { ThemedButton } from '@/components/mobile/ui/ThemedButton'
import { AuthProvider, useAuth } from '@/lib/mobile/auth-context'
import { ThemeProvider, useTheme } from '@/lib/mobile/theme-context'
import { 
  User, 
  Phone, 
  Calendar,
  Mail,
  MapPin,
  Save,
  Camera,
  X,
  Check,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'

interface ProfileFormData {
  firstName: string
  lastName: string
  email: string
  birthDate: string
  address: string
  city: string
  district: string
}

function ProfileEditContent() {
  const { customer, updateCustomer } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    birthDate: '',
    address: '',
    city: '',
    district: ''
  })
  const [errors, setErrors] = useState<Partial<ProfileFormData>>({})

  useEffect(() => {
    if (customer) {
      console.log('Customer data in profile edit:', customer)
      
      // Split the name field into firstName and lastName
      const nameParts = (customer.name || '').split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''
      
      setFormData({
        firstName,
        lastName,
        email: customer.email || '',
        birthDate: customer.birthDate ? format(new Date(customer.birthDate), 'yyyy-MM-dd') : '',
        address: customer.address || '',
        city: customer.city || '',
        district: customer.district || ''
      })
    }
  }, [customer])

  const validateForm = (): boolean => {
    const newErrors: Partial<ProfileFormData> = {}
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Ad zorunludur'
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Soyad zorunludur'
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    setIsSaving(true)
    
    try {
      const response = await fetch(`/api/customers/${customer?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_BEARER_TOKEN}`
        },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          birthDate: formData.birthDate || null,
          address: formData.address,
          city: formData.city,
          district: formData.district
        })
      })

      if (response.ok) {
        const updatedCustomer = await response.json()
        updateCustomer(updatedCustomer)
        toast.success('Profil bilgileriniz güncellendi')
        router.push('/mobile/profile')
      } else {
        toast.error('Güncelleme başarısız oldu')
      }
    } catch (error) {
      console.error('Profile update failed:', error)
      toast.error('Bir hata oluştu')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className="px-4 pb-20 space-y-6 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div 
          className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-5"
          style={{ backgroundColor: theme.primary }}
        />
        <div 
          className="absolute top-40 -left-10 w-40 h-40 rounded-full opacity-3"
          style={{ backgroundColor: theme.accent }}
        />
      </div>

      {/* Profile Photo Section */}
      <ThemedCard className="relative overflow-hidden">
        <div 
          className="absolute top-0 left-0 right-0 h-20"
          style={{
            background: `linear-gradient(180deg, ${theme.primary}20 0%, transparent 100%)`
          }}
        />
        <div className="relative flex flex-col items-center py-6">
          <div className="relative mb-4">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`
              }}
            >
              <User className="w-12 h-12 text-white" />
            </div>
            <button 
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full shadow-lg flex items-center justify-center transform transition-transform hover:scale-110"
              style={{
                backgroundColor: theme.accent,
                color: 'white'
              }}
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs font-medium" style={{ color: theme.textSecondary }}>
            Profil fotoğrafı ekle
          </p>
        </div>
      </ThemedCard>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.textPrimary }}>
              Ad
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className="w-full px-4 py-3 rounded-xl font-medium bg-theme-surface focus:outline-none focus:ring-2 transition-all"
                style={{
                  borderWidth: '2px',
                  borderColor: errors.firstName ? theme.error : `${theme.primary}20`,
                  color: theme.textPrimary
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = theme.primary
                  e.target.style.boxShadow = `0 0 0 3px ${theme.primary}20`
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.firstName ? theme.error : `${theme.primary}20`
                  e.target.style.boxShadow = ''
                }}
              />
              {errors.firstName && (
                <p className="text-xs mt-1 flex items-center gap-1" style={{ color: theme.error }}>
                  <AlertCircle className="w-3 h-3" />
                  {errors.firstName}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.textPrimary }}>
              Soyad
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="w-full px-4 py-3 rounded-xl font-medium bg-theme-surface focus:outline-none focus:ring-2 transition-all"
                style={{
                  borderWidth: '2px',
                  borderColor: errors.lastName ? theme.error : `${theme.primary}20`,
                  color: theme.textPrimary
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = theme.primary
                  e.target.style.boxShadow = `0 0 0 3px ${theme.primary}20`
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.lastName ? theme.error : `${theme.primary}20`
                  e.target.style.boxShadow = ''
                }}
              />
              {errors.lastName && (
                <p className="text-xs mt-1 flex items-center gap-1" style={{ color: theme.error }}>
                  <AlertCircle className="w-3 h-3" />
                  {errors.lastName}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <ThemedCard>
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: theme.textPrimary }}>
            <Phone className="w-4 h-4" style={{ color: theme.primary }} />
            İletişim Bilgileri
          </h3>
          
          <div className="space-y-4">
            {/* Phone (Read-only) */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.textPrimary }}>
                Telefon
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={customer?.phone || ''}
                  disabled
                  className="w-full px-4 py-3 rounded-xl font-medium opacity-60"
                  style={{
                    backgroundColor: `${theme.surface}`,
                    borderWidth: '2px',
                    borderColor: `${theme.primary}10`,
                    color: theme.textSecondary
                  }}
                />
                <div 
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg text-xs font-medium"
                  style={{
                    backgroundColor: `${theme.info}20`,
                    color: theme.info
                  }}
                >
                  Değiştirilemez
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.textPrimary }}>
                E-posta
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: theme.textSecondary }} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl font-medium bg-theme-surface focus:outline-none focus:ring-2 transition-all"
                  placeholder="ornek@email.com"
                  style={{
                    borderWidth: '2px',
                    borderColor: errors.email ? theme.error : `${theme.primary}20`,
                    color: theme.textPrimary
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = theme.primary
                    e.target.style.boxShadow = `0 0 0 3px ${theme.primary}20`
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.email ? theme.error : `${theme.primary}20`
                    e.target.style.boxShadow = ''
                  }}
                />
                {errors.email && (
                  <p className="text-xs mt-1 flex items-center gap-1" style={{ color: theme.error }}>
                    <AlertCircle className="w-3 h-3" />
                    {errors.email}
                  </p>
                )}
              </div>
            </div>
          </div>
        </ThemedCard>

        {/* Personal Information */}
        <ThemedCard>
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: theme.textPrimary }}>
            <Calendar className="w-4 h-4" style={{ color: theme.primary }} />
            Kişisel Bilgiler
          </h3>
          
          {/* Birth Date */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.textPrimary }}>
              Doğum Tarihi
            </label>
            <input
              type="date"
              value={formData.birthDate}
              onChange={(e) => handleInputChange('birthDate', e.target.value)}
              className="w-full px-4 py-3 rounded-xl font-medium bg-theme-surface focus:outline-none focus:ring-2 transition-all"
              style={{
                borderWidth: '2px',
                borderColor: `${theme.primary}20`,
                color: theme.textPrimary
              }}
              onFocus={(e) => {
                e.target.style.borderColor = theme.primary
                e.target.style.boxShadow = `0 0 0 3px ${theme.primary}20`
              }}
              onBlur={(e) => {
                e.target.style.borderColor = `${theme.primary}20`
                e.target.style.boxShadow = ''
              }}
            />
          </div>
        </ThemedCard>

        {/* Address Information */}
        <ThemedCard>
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: theme.textPrimary }}>
            <MapPin className="w-4 h-4" style={{ color: theme.primary }} />
            Adres Bilgileri
          </h3>
          
          <div className="space-y-4">
            {/* Address */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.textPrimary }}>
                Adres
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl font-medium bg-theme-surface focus:outline-none focus:ring-2 transition-all resize-none"
                placeholder="Mahalle, sokak, bina no..."
                style={{
                  borderWidth: '2px',
                  borderColor: `${theme.primary}20`,
                  color: theme.textPrimary
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = theme.primary
                  e.target.style.boxShadow = `0 0 0 3px ${theme.primary}20`
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = `${theme.primary}20`
                  e.target.style.boxShadow = ''
                }}
              />
            </div>

            {/* City and District */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.textPrimary }}>
                  İl
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl font-medium bg-theme-surface focus:outline-none focus:ring-2 transition-all"
                  placeholder="İstanbul"
                  style={{
                    borderWidth: '2px',
                    borderColor: `${theme.primary}20`,
                    color: theme.textPrimary
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = theme.primary
                    e.target.style.boxShadow = `0 0 0 3px ${theme.primary}20`
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = `${theme.primary}20`
                    e.target.style.boxShadow = ''
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.textPrimary }}>
                  İlçe
                </label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => handleInputChange('district', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl font-medium bg-theme-surface focus:outline-none focus:ring-2 transition-all"
                  placeholder="Kadıköy"
                  style={{
                    borderWidth: '2px',
                    borderColor: `${theme.primary}20`,
                    color: theme.textPrimary
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = theme.primary
                    e.target.style.boxShadow = `0 0 0 3px ${theme.primary}20`
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = `${theme.primary}20`
                    e.target.style.boxShadow = ''
                  }}
                />
              </div>
            </div>
          </div>
        </ThemedCard>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <ThemedButton
            variant="outline"
            size="lg"
            onClick={() => router.back()}
            disabled={isSaving}
            className="flex-1"
          >
            <X className="w-5 h-5 mr-2" />
            İptal
          </ThemedButton>

          <ThemedButton
            variant="primary"
            size="lg"
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`,
              boxShadow: `0 10px 30px ${theme.primary}40`
            }}
          >
            {isSaving ? (
              <div className="flex items-center justify-center">
                <div 
                  className="animate-spin rounded-full h-5 w-5 border-b-2 mr-3"
                  style={{ borderBottomColor: 'white' }}
                />
                <span>Kaydediliyor...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Save className="w-5 h-5 mr-2" />
                <span>Kaydet</span>
              </div>
            )}
          </ThemedButton>
        </div>
      </div>
    </div>
  )
}

export default function ProfileEditPage() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <MobileContainer title="Profili Düzenle" showBack>
          <ProfileEditContent />
        </MobileContainer>
      </ThemeProvider>
    </AuthProvider>
  )
}