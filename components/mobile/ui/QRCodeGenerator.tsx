'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { ThemedCard } from './ThemedCard'
import { ThemedButton } from './ThemedButton'
import { Download, Share2, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

interface QRCodeGeneratorProps {
  data: string
  title?: string
  subtitle?: string
  size?: number
  showActions?: boolean
  className?: string
}

export function QRCodeGenerator({
  data,
  title,
  subtitle,
  size = 200,
  showActions = true,
  className = ''
}: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    generateQRCode()
  }, [data, size])

  const generateQRCode = async () => {
    if (!canvasRef.current) return

    setIsGenerating(true)
    
    try {
      // Generate QR code on canvas
      await QRCode.toCanvas(canvasRef.current, data, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      })

      // Get data URL for sharing/downloading
      const dataUrl = canvasRef.current.toDataURL('image/png')
      setQrDataUrl(dataUrl)
    } catch (error) {
      console.error('QR Code generation failed:', error)
      toast.error('QR kod oluşturulamadı')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data)
      setCopied(true)
      toast.success('Kod kopyalandı')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Kopyalama başarısız')
    }
  }

  const handleDownload = () => {
    if (!qrDataUrl) return

    const link = document.createElement('a')
    link.download = `qr-code-${Date.now()}.png`
    link.href = qrDataUrl
    link.click()
    
    toast.success('QR kod indirildi')
  }

  const handleShare = async () => {
    if (!qrDataUrl) return

    if (navigator.share) {
      try {
        // Convert data URL to blob
        const response = await fetch(qrDataUrl)
        const blob = await response.blob()
        const file = new File([blob], 'qr-code.png', { type: 'image/png' })

        await navigator.share({
          title: title || 'QR Kod',
          text: subtitle || data,
          files: [file]
        })
      } catch (error) {
        console.error('Share failed:', error)
        toast.error('Paylaşım başarısız')
      }
    } else {
      // Fallback to copy
      handleCopy()
    }
  }

  return (
    <ThemedCard className={`text-center ${className}`}>
      {/* Header */}
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h3 className="font-semibold text-theme-text-primary mb-1">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-theme-text-secondary">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* QR Code */}
      <div className="relative inline-block">
        {isGenerating && (
          <div 
            className="flex items-center justify-center bg-gray-100 rounded-lg"
            style={{ width: size, height: size }}
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary"></div>
          </div>
        )}
        
        <canvas
          ref={canvasRef}
          className={`rounded-lg shadow-theme ${isGenerating ? 'hidden' : 'block'}`}
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>

      {/* Data Display */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs font-mono text-theme-text-secondary break-all">
          {data}
        </p>
      </div>

      {/* Actions */}
      {showActions && !isGenerating && (
        <div className="flex gap-2 mt-4">
          <ThemedButton
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex-1"
          >
            {copied ? (
              <Check className="w-4 h-4 mr-1" />
            ) : (
              <Copy className="w-4 h-4 mr-1" />
            )}
            {copied ? 'Kopyalandı' : 'Kopyala'}
          </ThemedButton>

          <ThemedButton
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-1" />
            İndir
          </ThemedButton>

          <ThemedButton
            variant="primary"
            size="sm"
            onClick={handleShare}
            className="flex-1"
          >
            <Share2 className="w-4 h-4 mr-1" />
            Paylaş
          </ThemedButton>
        </div>
      )}

      {/* Usage Instructions */}
      <div className="mt-4 text-xs text-theme-text-secondary">
        <p>Bu kodu kasada göstererek kampanyadan yararlanabilirsiniz</p>
      </div>
    </ThemedCard>
  )
}