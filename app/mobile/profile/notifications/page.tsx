'use client'

import { MobileContainer } from '@/components/mobile/layout/MobileContainer'
import { AuthProvider } from '@/lib/mobile/auth-context'
import { ThemeProvider } from '@/lib/mobile/theme-context'
import { NotificationSettings } from '@/components/mobile/notifications/NotificationSettings'
import { NotificationSettingsContent } from './NotificationSettingsContent'

export default function NotificationSettingsPage() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <MobileContainer 
          title="Bildirim Ayarları"
          showBack
        >
          <NotificationSettingsContent />
        </MobileContainer>
      </ThemeProvider>
    </AuthProvider>
  )
}