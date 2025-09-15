'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { formatPhoneNumber } from '@/lib/sms'

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit?: () => void
  error?: string
  disabled?: boolean
  autoFocus?: boolean
  style?: React.CSSProperties
}

export function PhoneInput({
  value,
  onChange,
  onSubmit,
  error,
  disabled = false,
  autoFocus = false,
  style
}: PhoneInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [displayValue, setDisplayValue] = useState('')

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-digit characters
    const cleaned = e.target.value.replace(/\D/g, '')
    
    // Limit to 10 digits (Turkish mobile)
    const limited = cleaned.slice(0, 10)
    
    // Update the raw value
    onChange(limited)
    
    // Format for display
    if (limited.length > 0) {
      setDisplayValue(formatPhoneNumber(limited))
    } else {
      setDisplayValue('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.length === 10 && onSubmit) {
      onSubmit()
    }
  }

  useEffect(() => {
    if (value) {
      setDisplayValue(formatPhoneNumber(value))
    } else {
      setDisplayValue('')
    }
  }, [value])

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
          +90
        </div>
        <Input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="5XX XXX XX XX"
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={`pl-14 h-14 text-lg font-medium ${
            error ? 'border-red-500 focus:ring-red-500' : ''
          }`}
          style={style}
          maxLength={17} // Account for formatting
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
          {error}
        </p>
      )}
    </div>
  )
}