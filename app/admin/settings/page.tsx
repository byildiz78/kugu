'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Coins
} from 'lucide-react'
import { UserManagement } from '@/components/admin/settings/user-management'
import { PointSystem } from '@/components/admin/settings/point-system'

type SettingsTab = 'users' | 'points'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('users')

  const settingsTabs = [
    {
      id: 'users' as SettingsTab,
      title: 'Kullanıcı Yönetimi',
      description: 'Sistem kullanıcılarını yönetin',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      badge: 'Yeni'
    },
    {
      id: 'points' as SettingsTab,
      title: 'Puan Sistemi',
      description: 'Puan kazanma ayarları',
      icon: Coins,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      badge: 'Yeni'
    }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />
      case 'points':
        return <PointSystem />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
        <p className="text-gray-600">Sistem ayarlarını yönetin ve yapılandırın</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ayar Kategorileri</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {settingsTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                      activeTab === tab.id 
                        ? 'bg-blue-50 border-r-2 border-blue-500 text-blue-700 font-medium' 
                        : 'text-gray-700'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${tab.bgColor}`}>
                      <tab.icon className={`h-4 w-4 ${tab.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{tab.title}</span>
                        {tab.badge && (
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                            {tab.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{tab.description}</p>
                    </div>
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}