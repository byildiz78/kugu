'use client'

import { useEffect, useState, memo } from 'react'
import { MobileContainer } from '@/components/mobile/layout/MobileContainer'
import { MobileBottomNav } from '@/components/mobile/layout/MobileBottomNav'
import { AuthProvider } from '@/lib/mobile/auth-context'
import { ThemeProvider, useTheme } from '@/lib/mobile/theme-context'
import { ArrowLeft, Phone, Mail, MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/mobile/ui/LoadingSpinner'

// Memoized iframe to prevent unnecessary re-renders
const ContactIframe = memo(({ html }: { html: string }) => (
  <iframe
    srcdoc={html}
    className="w-full border-0 rounded-xl shadow-sm"
    style={{ 
      height: '80vh', 
      minHeight: '600px',
      backgroundColor: 'white'
    }}
    title="İletişim Bilgileri"
    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
  />
))
ContactIframe.displayName = 'ContactIframe'

function ContactContent() {
  const { theme, isLoading } = useTheme()
  const [contactInfo, setContactInfo] = useState<string | null>(null)
  const [isFullHtmlDocument, setIsFullHtmlDocument] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Contact info processing - separate from blob URL creation
  useEffect(() => {
    if (!isLoading && theme.contact_information) {
      setContactInfo(theme.contact_information)
      // Full HTML document mu kontrol et (DOCTYPE veya <html> tag'i var mı)
      const isFullDoc = theme.contact_information.trim().toLowerCase().includes('<!doctype') || 
                       theme.contact_information.trim().toLowerCase().includes('<html')
      setIsFullHtmlDocument(isFullDoc)
      setLoading(false)
    } else if (!isLoading && !theme.contact_information) {
      // Varsayılan içerik
      setContactInfo(`
        <div class="space-y-4">
          <div>
            <h3 class="font-semibold text-lg mb-2">İletişim Bilgileri</h3>
            <p class="text-gray-600">Bizimle iletişime geçin!</p>
          </div>
          
          <div class="space-y-2">
            <div class="flex items-center space-x-3">
              <span class="font-medium">📧 E-posta:</span>
              <span>info@restaurant.com</span>
            </div>
            <div class="flex items-center space-x-3">
              <span class="font-medium">📞 Telefon:</span>
              <span>+90 212 555 0123</span>
            </div>
            <div class="flex items-center space-x-3">
              <span class="font-medium">📍 Adres:</span>
              <span>İstanbul, Türkiye</span>
            </div>
          </div>
          
          <div class="mt-4">
            <p class="text-sm text-gray-500">
              Çalışma Saatleri: Pazartesi-Pazar 09:00-22:00
            </p>
          </div>
        </div>
      `)
      setIsFullHtmlDocument(false)
      setLoading(false)
    }
  }, [theme.contact_information, isLoading])


  if (isLoading || loading) {
    return (
      <MobileContainer>
        <div className="flex items-center justify-center min-h-[50vh]">
          <LoadingSpinner />
        </div>
      </MobileContainer>
    )
  }

  return (
    <MobileContainer>
      {/* Header */}
      <div className="bg-theme-surface shadow-sm sticky top-0 z-10">
        <div className="flex items-center p-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 mr-2 text-theme-text-secondary hover:text-theme-primary transition-colors rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-theme-text-primary">İletişim</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-20">
        {contactInfo ? (
          <div className="w-full">
            {/* Direct HTML render - works for both simple HTML and full documents */}
            {isFullHtmlDocument ? (
              /* Full HTML Document - Render with memoized iframe */
              <div className="w-full">
                <ContactIframe html={contactInfo} />
              </div>
            ) : (
              /* Simple HTML or fallback - direct render */
              <div className="bg-theme-surface rounded-xl p-6 shadow-sm">
                <div
                  className="contact-content text-theme-text-primary"
                  dangerouslySetInnerHTML={{ __html: contactInfo }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="bg-theme-surface rounded-xl p-6 shadow-sm">
            <div className="text-center py-8">
              <Phone className="w-12 h-12 text-theme-primary mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-theme-text-primary mb-2">
                İletişim Bilgileri
              </h2>
              <p className="text-theme-text-secondary">
                İletişim bilgileri yüklenemedi.
              </p>
            </div>
          </div>
        )}

        {/* Quick Actions - sadece basit HTML'de göster */}
        {!isFullHtmlDocument && (
          <div className="mt-6 grid grid-cols-3 gap-3">
          <a
            href="tel:+902125550123"
            className="flex flex-col items-center p-4 bg-theme-surface rounded-xl shadow-sm text-center hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 bg-theme-primary/10 rounded-full flex items-center justify-center mb-2">
              <Phone className="w-5 h-5 text-theme-primary" />
            </div>
            <span className="text-sm font-medium text-theme-text-primary">Ara</span>
          </a>

          <a
            href="mailto:info@restaurant.com"
            className="flex flex-col items-center p-4 bg-theme-surface rounded-xl shadow-sm text-center hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 bg-theme-primary/10 rounded-full flex items-center justify-center mb-2">
              <Mail className="w-5 h-5 text-theme-primary" />
            </div>
            <span className="text-sm font-medium text-theme-text-primary">E-posta</span>
          </a>

          <a
            href="https://maps.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center p-4 bg-theme-surface rounded-xl shadow-sm text-center hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 bg-theme-primary/10 rounded-full flex items-center justify-center mb-2">
              <MapPin className="w-5 h-5 text-theme-primary" />
            </div>
            <span className="text-sm font-medium text-theme-text-primary">Konum</span>
          </a>
          </div>
        )}
      </div>
    </MobileContainer>
  )
}

export default function ContactPage() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="min-h-screen bg-theme-background">
          <ContactContent />
          <MobileBottomNav />
        </div>
      </ThemeProvider>
    </AuthProvider>
  )
}