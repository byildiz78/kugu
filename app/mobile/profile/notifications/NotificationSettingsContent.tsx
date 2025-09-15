'use client'

import { useAuth } from '@/lib/mobile/auth-context'
import { NotificationSettings } from '@/components/mobile/notifications/NotificationSettings'

export function NotificationSettingsContent() {
  const { customer } = useAuth()

  if (!customer) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Kullanıcı bilgileri yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <NotificationSettings customerId={customer.id} />
    </div>
  )
}