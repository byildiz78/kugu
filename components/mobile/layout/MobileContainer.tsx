import { MobileHeader } from './MobileHeader'
import { MobileBottomNav } from './MobileBottomNav'

interface MobileContainerProps {
  children: React.ReactNode
  title: string
  showBack?: boolean
  showMenu?: boolean
  showNotifications?: boolean
  showBottomNav?: boolean
  onMenuClick?: () => void
  rightAction?: React.ReactNode
  className?: string
}

export function MobileContainer({
  children,
  title,
  showBack = false,
  showMenu = false,
  showNotifications = false,
  showBottomNav = true,
  onMenuClick,
  rightAction,
  className = ''
}: MobileContainerProps) {
  return (
    <div className="min-h-screen bg-theme-background flex flex-col">
      <MobileHeader
        title={title}
        showBack={showBack}
        showMenu={showMenu}
        showNotifications={showNotifications}
        onMenuClick={onMenuClick}
        rightAction={rightAction}
      />
      
      <main className={`flex-1 ${showBottomNav ? 'pb-16' : ''} ${className}`}>
        {children}
      </main>
      
      {showBottomNav && <MobileBottomNav />}
    </div>
  )
}