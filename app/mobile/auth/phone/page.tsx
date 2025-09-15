'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PhoneInput } from '@/components/mobile/auth/PhoneInput'
import { ThemedButton } from '@/components/mobile/ui/ThemedButton'
import { validatePhoneNumber } from '@/lib/sms'
import { Smartphone, ChevronRight, Sparkles, Shield, Heart } from 'lucide-react'
import { AuthProvider } from '@/lib/mobile/auth-context'
import { ThemeProvider, useTheme } from '@/lib/mobile/theme-context'

function PhoneAuthContent() {
  const router = useRouter()
  const { theme } = useTheme()
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    
    console.log('Raw phone input:', phone)
    
    // Validate phone number
    const validation = validatePhoneNumber(phone)
    console.log('Phone validation:', validation)
    
    if (!validation.isValid) {
      setError(validation.error || 'Geçersiz telefon numarası')
      return
    }

    setIsLoading(true)

    try {
      const requestBody = { phone: validation.cleaned }
      console.log('Sending request:', requestBody)
      
      // Request OTP
      const response = await fetch('/api/mobile/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()
      console.log('API response:', data)

      if (data.success) {
        // Store phone in sessionStorage for next page
        sessionStorage.setItem('auth_phone', validation.cleaned!)
        router.push('/mobile/auth/verify')
      } else {
        console.error('API error:', data)
        setError(data.error || 'SMS gönderilemedi')
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ backgroundColor: theme.background }}>
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div 
          className="absolute top-0 left-0 w-full h-full"
          style={{
            background: `linear-gradient(135deg, ${theme.primary}05 0%, ${theme.secondary}05 50%, ${theme.accent}05 100%)`
          }}
        />
        <div 
          className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-10 animate-float"
          style={{ backgroundColor: theme.primary }}
        />
        <div 
          className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-10 animate-float"
          style={{ backgroundColor: theme.secondary, animationDelay: '1s', animationDirection: 'reverse' }}
        />
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-5"
          style={{ backgroundColor: theme.accent }}
        />
      </div>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        <div className="max-w-sm mx-auto w-full">
          {/* Logo/Icon */}
          <div className="text-center mb-8 animate-fade-in-scale">
            <div className="relative inline-block mb-6">
              <div 
                className="absolute inset-0 rounded-3xl blur-2xl opacity-30 animate-pulse"
                style={{ backgroundColor: theme.primary }}
              />
              <div 
                className="relative inline-flex items-center justify-center w-24 h-24 rounded-3xl shadow-2xl transform hover:scale-110 transition-transform duration-300"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`,
                  boxShadow: `0 20px 40px ${theme.primary}30`
                }}
              >
                <Smartphone className="w-12 h-12 text-white" />
              </div>
              <div 
                className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center animate-bounce"
                style={{ backgroundColor: theme.accent }}
              >
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-3 animate-fade-in" style={{ color: theme.textPrimary, animationDelay: '200ms' }}>
              Hoş Geldiniz
            </h1>
            <p className="text-lg animate-fade-in" style={{ color: theme.textSecondary, animationDelay: '300ms' }}>
              Sadakat programına katılın ve ayrıcalıklardan yararlanın
            </p>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-3 gap-4 mb-8 animate-fade-in" style={{ animationDelay: '400ms' }}>
            <div className="text-center">
              <div 
                className="w-12 h-12 rounded-2xl mx-auto mb-2 flex items-center justify-center"
                style={{ backgroundColor: `${theme.success}20` }}
              >
                <Heart className="w-6 h-6" style={{ color: theme.success }} />
              </div>
              <p className="text-xs font-medium" style={{ color: theme.textSecondary }}>Özel Fırsatlar</p>
            </div>
            <div className="text-center">
              <div 
                className="w-12 h-12 rounded-2xl mx-auto mb-2 flex items-center justify-center"
                style={{ backgroundColor: `${theme.warning}20` }}
              >
                <Sparkles className="w-6 h-6" style={{ color: theme.warning }} />
              </div>
              <p className="text-xs font-medium" style={{ color: theme.textSecondary }}>Puan Kazan</p>
            </div>
            <div className="text-center">
              <div 
                className="w-12 h-12 rounded-2xl mx-auto mb-2 flex items-center justify-center"
                style={{ backgroundColor: `${theme.info}20` }}
              >
                <Shield className="w-6 h-6" style={{ color: theme.info }} />
              </div>
              <p className="text-xs font-medium" style={{ color: theme.textSecondary }}>Güvenli</p>
            </div>
          </div>

          {/* Phone Input Form */}
          <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: theme.textPrimary }}>
                Telefon Numaranız
              </label>
              <div className="relative">
                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                  onSubmit={handleSubmit}
                  error={error}
                  disabled={isLoading}
                  autoFocus
                  style={{
                    borderColor: error ? theme.error : `${theme.primary}30`,
                    backgroundColor: theme.surface
                  }}
                />
                {phone.length === 10 && !error && (
                  <div 
                    className="absolute right-3 top-1/2 -translate-y-1/2 animate-fade-in"
                  >
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: theme.success }}
                    >
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <ThemedButton
              onClick={handleSubmit}
              disabled={phone.length !== 10 || isLoading}
              className="w-full h-14 text-lg font-semibold shadow-lg transform transition-all duration-300 hover:scale-105"
              variant="primary"
              style={{
                background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`,
                boxShadow: `0 10px 30px ${theme.primary}40`
              }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div 
                    className="animate-spin rounded-full h-5 w-5 border-b-2 mr-3"
                    style={{ borderBottomColor: 'white' }}
                  />
                  <span>Gönderiliyor...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span>Devam Et</span>
                  <ChevronRight className="w-6 h-6 ml-2 animate-bounce-x" />
                </div>
              )}
            </ThemedButton>

            {/* Info Text */}
            <div className="text-center animate-fade-in" style={{ animationDelay: '600ms' }}>
              <p className="text-xs" style={{ color: theme.textSecondary }}>
                Devam ederek{' '}
                <a href="#" className="underline font-medium" style={{ color: theme.primary }}>
                  Kullanım Koşulları
                </a>
                'nı kabul etmiş olursunuz.
              </p>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center justify-center space-x-6 pt-4 animate-fade-in" style={{ animationDelay: '700ms' }}>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" style={{ color: theme.success }} />
                <span className="text-xs font-medium" style={{ color: theme.textSecondary }}>256-bit SSL</span>
              </div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4" style={{ color: theme.warning }} />
                <span className="text-xs font-medium" style={{ color: theme.textSecondary }}>Hızlı Kayıt</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave Decoration */}
      <div className="relative">
        <svg 
          className="absolute bottom-0 w-full" 
          viewBox="0 0 1440 120" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          style={{ height: '120px' }}
        >
          <path 
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V120Z" 
            fill={theme.primary}
            fillOpacity="0.1"
          />
          <path 
            d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 40C840 50 960 70 1080 80C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V120Z" 
            fill={theme.primary}
            fillOpacity="0.2"
          />
        </svg>
      </div>
    </div>
  )
}

export default function PhoneAuthPage() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <PhoneAuthContent />
      </ThemeProvider>
    </AuthProvider>
  )
}