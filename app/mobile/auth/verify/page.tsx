'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { OTPInput } from '@/components/mobile/auth/OTPInput'
import { Button } from '@/components/ui/button'
import { ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react'
import { formatPhoneNumber } from '@/lib/sms'

export default function VerifyOTPPage() {
  const router = useRouter()
  const [otp, setOtp] = useState('')
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')
  const [resendTimer, setResendTimer] = useState(60)
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    // Get phone from sessionStorage
    const storedPhone = sessionStorage.getItem('auth_phone')
    if (!storedPhone) {
      router.push('/mobile/auth/phone')
      return
    }
    setPhone(storedPhone)
  }, [router])

  useEffect(() => {
    // Countdown timer for resend
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [resendTimer])

  const handleVerify = async (otpValue?: string) => {
    const codeToVerify = otpValue || otp
    if (codeToVerify.length !== 4) return

    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/mobile/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone, 
          otp: codeToVerify 
        }),
        credentials: 'include'
      })

      const data = await response.json()

      if (data.success) {
        console.log('OTP verification successful, redirecting...')
        if (data.isNewCustomer) {
          // New customer - redirect to registration
          console.log('New customer, redirecting to register')
          window.location.href = '/mobile/auth/register'
        } else {
          // Existing customer - redirect to dashboard
          console.log('Existing customer, redirecting to dashboard')
          window.location.href = '/mobile/dashboard'
        }
        return
      } else {
        setError(data.error || 'Doğrulama başarısız')
        setOtp('')
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setIsResending(true)
    setError('')

    try {
      const response = await fetch('/api/mobile/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      })

      const data = await response.json()

      if (data.success) {
        setResendTimer(60)
        setCanResend(false)
        setOtp('')
      } else {
        setError(data.error || 'SMS gönderilemedi')
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Header */}
      <div className="px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="p-2"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        <div className="max-w-sm mx-auto w-full">
          {/* Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <ShieldCheck className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Doğrulama Kodu
            </h1>
            <p className="text-gray-600">
              {formatPhoneNumber(phone)} numarasına gönderilen 4 haneli kodu girin
            </p>
          </div>

          {/* OTP Input */}
          <div className="space-y-6">
            <OTPInput
              value={otp}
              onChange={setOtp}
              onComplete={handleVerify}
              error={error}
              disabled={isLoading}
              autoFocus
            />

            <Button
              onClick={() => handleVerify()}
              disabled={otp.length !== 4 || isLoading}
              className="w-full h-12 text-base font-medium"
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Doğrulanıyor...
                </>
              ) : (
                'Doğrula'
              )}
            </Button>

            {/* Resend */}
            <div className="text-center">
              {canResend ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResend}
                  disabled={isResending}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Tekrar Gönder
                    </>
                  )}
                </Button>
              ) : (
                <p className="text-sm text-gray-500">
                  Yeni kod için {resendTimer} saniye bekleyin
                </p>
              )}
            </div>

            {/* Different Number */}
            <div className="text-center pt-4 border-t border-gray-200">
              <Button
                variant="link"
                size="sm"
                onClick={() => router.push('/mobile/auth/phone')}
                className="text-gray-600 hover:text-gray-700"
              >
                Farklı bir numara kullan
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}