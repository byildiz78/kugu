'use client'

import { ArrowLeft, Menu, Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/hooks/useNotifications'

interface MobileHeaderProps {
  title: string
  showBack?: boolean
  showMenu?: boolean
  showNotifications?: boolean
  onMenuClick?: () => void
  rightAction?: React.ReactNode
}

export function MobileHeader({
  title,
  showBack = false,
  showMenu = false,
  showNotifications = false,
  onMenuClick,
  rightAction
}: MobileHeaderProps) {
  const router = useRouter()
  const { count } = useNotifications()

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
      {/* Left Side */}
      <div className="flex items-center space-x-3">
        {showBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="p-2 -ml-2"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Button>
        )}
        
        {showMenu && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="p-2 -ml-2"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </Button>
        )}
      </div>

      {/* Center - Title */}
      <div className="flex-1 text-center">
        <h1 className="text-lg font-semibold text-gray-900 truncate px-4">
          {title}
        </h1>
      </div>

      {/* Right Side */}
      <div className="flex items-center space-x-2">
        {showNotifications && (
          <Button
            variant="ghost"
            size="sm"
            className="p-2 relative"
            onClick={() => router.push('/mobile/notifications')}
          >
            <Bell className="h-5 w-5 text-gray-600" />
            {/* Unread notification count */}
            {count.unread > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-5 h-5 flex items-center justify-center px-1">
                {count.unread > 99 ? '99+' : count.unread}
              </div>
            )}
          </Button>
        )}
        
        {rightAction && rightAction}
      </div>
    </div>
  )
}