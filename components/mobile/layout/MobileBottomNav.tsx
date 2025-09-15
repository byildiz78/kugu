'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Tag, Gift, User, Phone } from 'lucide-react'
import { useTheme } from '@/lib/mobile/theme-context'

const navItems = [
  {
    label: 'Ana Sayfa',
    href: '/mobile/dashboard',
    icon: Home,
  },
  {
    label: 'Kampanyalar',
    href: '/mobile/campaigns',
    icon: Tag,
  },
  {
    label: 'Ödüller',
    href: '/mobile/rewards',
    icon: Gift,
  },
  {
    label: 'İletişim',
    href: '/mobile/contact',
    icon: Phone,
  },
  {
    label: 'Profil',
    href: '/mobile/profile',
    icon: User,
  },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const { theme } = useTheme()

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-theme-surface border-t shadow-lg px-2 py-1 z-50" 
         style={{ borderTopColor: `${theme.primary}20` }}>
      {/* Gradient background */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{ 
          background: `linear-gradient(90deg, ${theme.primary} 0%, ${theme.secondary} 50%, ${theme.accent} 100%)` 
        }}
      />
      
      <div className="relative flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-3 px-3 rounded-2xl transition-all duration-300 min-w-0 flex-1 transform ${
                isActive
                  ? 'scale-105 shadow-lg'
                  : 'hover:scale-102'
              }`}
              style={{
                backgroundColor: isActive ? `${theme.primary}15` : 'transparent',
                color: isActive ? theme.primary : theme.textSecondary
              }}
            >
              <Icon 
                className="h-6 w-6 mb-1 transition-all duration-300" 
                style={{ 
                  color: isActive ? theme.primary : theme.textSecondary,
                  filter: isActive ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'none'
                }} 
              />
              <span 
                className="text-xs font-semibold truncate transition-all duration-300"
                style={{ 
                  color: isActive ? theme.primary : theme.textSecondary,
                  textShadow: isActive ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {item.label}
              </span>
              
              {/* Active indicator */}
              {isActive && (
                <div 
                  className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full animate-bounce-in"
                  style={{ backgroundColor: theme.primary }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}