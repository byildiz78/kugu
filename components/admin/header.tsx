'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Bell, Search, Star } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FeaturesModal } from '@/components/admin/features-modal'

export function AdminHeader() {
  const { data: session } = useSession()
  const [featuresModalOpen, setFeaturesModalOpen] = useState(false)

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Ara..."
            className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          className="relative text-gray-500 hover:text-purple-600 hover:bg-purple-50"
          onClick={() => setFeaturesModalOpen(true)}
          title="Sistem Özellikleri"
        >
          <Star className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="relative text-gray-500 hover:text-gray-700"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
        </Button>
        
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">
            {session?.user?.name || 'Admin'}
          </p>
          <p className="text-xs text-gray-500">
            Çevrimiçi
          </p>
        </div>
      </div>
      
      <FeaturesModal 
        isOpen={featuresModalOpen}
        onClose={() => setFeaturesModalOpen(false)}
      />
    </header>
  )
}