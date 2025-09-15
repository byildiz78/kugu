'use client'

import { ThemedCard } from '@/components/mobile/ui/ThemedCard'
import { LucideIcon } from 'lucide-react'

interface StatItem {
  label: string
  value: string | number
  icon: LucideIcon
  color?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

interface QuickStatsCardProps {
  stats: StatItem[]
}

export function QuickStatsCard({ stats }: QuickStatsCardProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        const animationDelay = index * 150
        
        return (
          <div
            key={index}
            className="relative overflow-hidden rounded-2xl shadow-sm transform transition-all duration-300 hover:scale-102 animate-fade-in"
            style={{ 
              animationDelay: `${animationDelay}ms`,
              background: `linear-gradient(135deg, ${stat.color || 'var(--color-primary)'}10 0%, ${stat.color || 'var(--color-primary)'}05 100%)`,
              border: `1px solid ${stat.color || 'var(--color-primary)'}15`
            }}
          >
            {/* Subtle background decoration */}
            <div className="absolute inset-0 opacity-5">
              <div 
                className="absolute -top-4 -right-4 w-16 h-16 rounded-full"
                style={{ 
                  backgroundColor: stat.color || 'var(--color-primary)'
                }}
              />
            </div>

            <div className="relative z-10 p-4">
              {/* Enhanced Icon with glow effect */}
              <div className="flex items-start justify-between mb-3">
                <div className="relative">
                  <div 
                    className="absolute inset-0 rounded-xl blur-lg opacity-30 animate-pulse"
                    style={{ backgroundColor: stat.color || 'var(--color-primary)' }}
                  />
                  <div 
                    className="relative p-2 rounded-xl transform transition-all duration-300 hover:scale-110 hover:rotate-6"
                    style={{ 
                      background: `linear-gradient(135deg, ${stat.color || 'var(--color-primary)'} 0%, ${stat.color || 'var(--color-primary-dark)'} 100%)`,
                      boxShadow: `0 8px 16px ${stat.color || 'var(--color-primary)'}40`
                    }}
                  >
                    <Icon className="w-5 h-5 text-white drop-shadow-lg" />
                  </div>
                </div>
                
                {stat.trend && (
                  <div 
                    className="flex items-center space-x-1 px-2 py-1 rounded-lg font-semibold text-xs backdrop-blur-sm animate-bounce-in"
                    style={{
                      background: stat.trend.isPositive 
                        ? 'linear-gradient(135deg, #10b981, #059669)' 
                        : 'linear-gradient(135deg, #ef4444, #dc2626)',
                      color: 'white',
                      animationDelay: `${animationDelay + 300}ms`
                    }}
                  >
                    <span className="text-xs">
                      {stat.trend.isPositive ? '↑' : '↓'}
                    </span>
                    <span>{stat.trend.isPositive ? '+' : ''}{stat.trend.value}%</span>
                  </div>
                )}
              </div>
              
              {/* Enhanced Value Display */}
              <div className="space-y-2 text-right">
                <p 
                  className="text-3xl font-black leading-none tracking-tight"
                  style={{ color: stat.color || 'var(--color-primary)' }}
                >
                  {typeof stat.value === 'number' 
                    ? stat.value.toLocaleString('tr-TR') 
                    : stat.value
                  }
                </p>
                <p className="text-sm font-semibold text-theme-text-secondary text-right">
                  {stat.label}
                </p>
              </div>

              {/* Simple Progress Bar */}
              <div className="mt-3">
                <div className="relative h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-2000 ease-out"
                    style={{ 
                      backgroundColor: stat.color || 'var(--color-primary)',
                      width: `${Math.min((index + 1) * 25, 100)}%`,
                      opacity: 0.7
                    }}
                  />
                </div>
              </div>

            </div>
          </div>
        )
      })}
    </div>
  )
}