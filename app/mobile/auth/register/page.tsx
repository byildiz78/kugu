'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Calendar, Mail } from 'lucide-react'
import { toast } from 'sonner'

const registrationSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
  surname: z.string().min(2, 'Soyisim en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir email adresi giriniz').optional().or(z.literal('')),
  birthDate: z.string().optional()
})

type RegistrationData = z.infer<typeof registrationSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema)
  })

  const onSubmit = async (data: RegistrationData) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/mobile/auth/complete-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${data.name} ${data.surname}`,
          email: data.email || undefined,
          birthDate: data.birthDate || undefined
        }),
        credentials: 'include'
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Kayıt başarıyla tamamlandı!')
        console.log('Registration successful, redirecting to dashboard')
        window.location.href = '/mobile/dashboard'
        return
      } else {
        toast.error(result.error || 'Kayıt tamamlanamadı')
      }
    } catch (err) {
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        <div className="max-w-sm mx-auto w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-4">
              <User className="w-10 h-10 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Bilgilerinizi Tamamlayın
            </h1>
            <p className="text-gray-600">
              Sadakat programına katılmak için son adım
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Adınız *
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Ahmet"
                  className="pl-10 h-12"
                  autoComplete="given-name"
                />
              </div>
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Surname */}
            <div className="space-y-2">
              <Label htmlFor="surname" className="text-sm font-medium text-gray-700">
                Soyadınız *
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="surname"
                  {...register('surname')}
                  placeholder="Yılmaz"
                  className="pl-10 h-12"
                  autoComplete="family-name"
                />
              </div>
              {errors.surname && (
                <p className="text-sm text-red-500">{errors.surname.message}</p>
              )}
            </div>

            {/* Email (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                E-posta (İsteğe bağlı)
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="ornek@email.com"
                  className="pl-10 h-12"
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Kampanya bildirimleri için kullanılacak
              </p>
            </div>

            {/* Birth Date (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="birthDate" className="text-sm font-medium text-gray-700">
                Doğum Tarihi (İsteğe bağlı)
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="birthDate"
                  type="date"
                  {...register('birthDate')}
                  className="pl-10 h-12"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <p className="text-xs text-gray-500">
                Doğum gününüze özel kampanyalar için
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-base font-medium mt-6"
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Kaydediliyor...
                </>
              ) : (
                'Kayıt Ol'
              )}
            </Button>

            {/* Terms */}
            <p className="text-xs text-center text-gray-500 mt-4">
              Kayıt olarak{' '}
              <a href="#" className="text-blue-600 underline">
                Gizlilik Politikası
              </a>
              {' '}ve{' '}
              <a href="#" className="text-blue-600 underline">
                KVKK Aydınlatma Metni
              </a>
              'ni kabul etmiş olursunuz.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}