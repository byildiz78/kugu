'use client'

import { useState, useRef, useEffect } from 'react'

interface OTPInputProps {
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  length?: number
  error?: string
  disabled?: boolean
  autoFocus?: boolean
}

export function OTPInput({
  value,
  onChange,
  onComplete,
  length = 4,
  error,
  disabled = false,
  autoFocus = false
}: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [autoFocus])

  useEffect(() => {
    // Update internal state when value prop changes
    const otpArray = value.split('').slice(0, length)
    const newOtp = [...new Array(length).fill('')]
    otpArray.forEach((digit, index) => {
      newOtp[index] = digit
    })
    setOtp(newOtp)
  }, [value, length])

  const handleChange = (index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return // Only allow digits

    const newOtp = [...otp]
    newOtp[index] = digit.slice(-1) // Only keep last digit

    setOtp(newOtp)
    const otpString = newOtp.join('')
    onChange(otpString)

    // Move to next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Call onComplete when all digits are filled
    if (otpString.length === length && onComplete) {
      onComplete(otpString)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      
      const newOtp = [...otp]
      newOtp[index] = ''
      setOtp(newOtp)
      onChange(newOtp.join(''))

      // Move to previous input on backspace
      if (index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, length)
    
    if (pastedData) {
      const newOtp = [...otp]
      pastedData.split('').forEach((digit, index) => {
        if (index < length) {
          newOtp[index] = digit
        }
      })
      setOtp(newOtp)
      const otpString = newOtp.join('')
      onChange(otpString)
      
      // Focus last input or next empty input
      const lastFilledIndex = newOtp.findLastIndex(digit => digit !== '')
      if (lastFilledIndex < length - 1) {
        inputRefs.current[lastFilledIndex + 1]?.focus()
      } else {
        inputRefs.current[length - 1]?.focus()
      }
      
      // Call onComplete if all digits are filled
      if (otpString.length === length && onComplete) {
        onComplete(otpString)
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-center gap-3">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            pattern="\d{1}"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={`w-14 h-14 text-center text-2xl font-bold border-2 rounded-lg 
              transition-all duration-200 ${
              error 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                : digit 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            } focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed`}
          />
        ))}
      </div>
      
      {error && (
        <p className="text-sm text-red-500 text-center">
          {error}
        </p>
      )}
    </div>
  )
}