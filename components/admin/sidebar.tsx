'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  Users, 
  Target, 
  Megaphone, 
  Settings,
  LogOut,
  Bell,
  Receipt,
  Package,
  TrendingUp,
  Crown,
  Palette,
  MessageSquare,
  BarChart3,
  Award
} from 'lucide-react'

const navigation = [
  { 
    name: 'Ana Sayfa', 
    href: '/admin', 
    icon: LayoutDashboard
  },
  { 
    name: 'Müşteriler', 
    href: '/admin/customers', 
    icon: Users
  },

  
  { 
    name: 'Ürün Yönetimi', 
    href: '/admin/products', 
    icon: Package
  },
  
  { 
    name: 'Seviye Yönetimi', 
    href: '/admin/tiers', 
    icon: Crown
  },
  { 
    name: 'Segmentler', 
    href: '/admin/segments', 
    icon: Target
  },
  { 
    name: 'Kampanyalar', 
    href: '/admin/campaigns', 
    icon: Megaphone
  }
]

const reportsNavigation = [
  {
    name: 'Analiz',
    href: '/admin/analytics',
    icon: BarChart3
  },
  {
    name: 'Satış Kayıtları',
    href: '/admin/transactions',
    icon: Receipt
  },
  {
    name: 'Para Puan Hareketleri',
    href: '/admin/point-transactions',
    icon: TrendingUp
  },
  {
    name: 'Kampanya Kullanımları',
    href: '/admin/campaign-usage',
    icon: Award
  }
]

const systemNavigation = [

  
  { 
    name: 'Bildirim Yönetimi', 
    href: '/admin/notifications', 
    icon: MessageSquare
  },
  { 
    name: 'Tema Yönetimi', 
    href: '/admin/themes', 
    icon: Palette
  },
  { 
    name: 'Ayarlar', 
    href: '/admin/settings', 
    icon: Settings
  }
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const handleLogout = () => {
    signOut()
  }

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="flex h-16 items-center px-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Air-CRM</h1>
            <p className="text-xs text-orange-600">Restaurant</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {session?.user?.name?.charAt(0) || 'A'}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {session?.user?.name || 'Admin'}
            </p>
            <p className="text-xs text-gray-500">Yönetici</p>
          </div>
          <Bell className="h-4 w-4 text-gray-400" />
        </div>
      </div>
      
      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-orange-50 hover:text-orange-700'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    isActive 
                      ? 'text-white' 
                      : 'text-gray-500 group-hover:text-orange-600'
                  )}
                />
                {item.name}
              </Link>
            )
          })}
        </div>

        {/* Reports Section */}
        <div className="mt-6">
          <div className="mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3">
              RAPORLAR
            </p>
          </div>
          
          <div className="space-y-1">
            {reportsNavigation.map((item) => {
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-orange-50 hover:text-orange-700'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive 
                        ? 'text-white' 
                        : 'text-gray-500 group-hover:text-orange-600'
                    )}
                  />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* System Section */}
      <div className="border-t border-gray-200 p-3">
        <div className="mb-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3">
            SİSTEM
          </p>
        </div>
        
        <div className="space-y-1">
          {systemNavigation.map((item) => {
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-700 hover:bg-orange-50 hover:text-orange-700'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    isActive 
                      ? 'text-white' 
                      : 'text-gray-500 group-hover:text-orange-600'
                  )}
                />
                {item.name}
              </Link>
            )
          })}
          
          {/* Logout Button */}
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200"
          >
            <LogOut className="mr-3 h-5 w-5 flex-shrink-0 text-gray-500 group-hover:text-red-600" />
            Çıkış Yap
          </Button>
        </div>
      </div>
    </div>
  )
}