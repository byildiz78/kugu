'use client'

import { useTheme } from '@/lib/mobile/theme-context'
import { TrendingUp, TrendingDown, Award, Zap } from 'lucide-react'

interface StatsOverviewProps {
  totalPoints: number
  monthlySpent: number
  rank: string
  achievements: number
}

export function StatsOverview({ totalPoints, monthlySpent, rank, achievements }: StatsOverviewProps) {
  const { theme } = useTheme()

  const statCards = [
    {
      label: 'Toplam Puan',
      value: totalPoints.toLocaleString('tr-TR'),
      icon: Award,
      color: 'var(--color-primary)',
      gradient: 'from-blue-500 to-blue-600',
      trend: '+12%'
    },
    {
      label: 'Aylık Harcama',
      value: `₺${monthlySpent.toLocaleString('tr-TR')}`,
      icon: TrendingUp,
      color: 'var(--color-success)',
      gradient: 'from-green-500 to-green-600',
      trend: '+8%'
    },
    {
      label: 'Sıralama',
      value: rank,
      icon: Zap,
      color: 'var(--color-accent)',
      gradient: 'from-yellow-500 to-orange-500',
      trend: '↑2'
    },
    {
      label: 'Başarımlar',
      value: achievements.toString(),
      icon: Award,
      color: 'var(--color-secondary)',
      gradient: 'from-purple-500 to-purple-600',
      trend: '+3'
    }
  ]

  return (
    <div className="grid grid-cols-2 gap-4 animate-fade-in-up">
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        
        return (
          <div
            key={index}
            className={`relative p-5 rounded-3xl bg-gradient-to-br ${stat.gradient} text-white shadow-xl transform transition-all duration-300 hover:scale-105 animate-slide-in-right overflow-hidden`}
            style={{ 
              animationDelay: `${index * 100}ms`,
              boxShadow: `0 10px 25px ${stat.color}30`
            }}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white"></div>
              <div className="absolute -bottom-2 -left-2 w-12 h-12 rounded-full bg-white"></div>
            </div>

            {/* Floating Icon */}
            <div className="absolute top-4 right-4 animate-float" style={{ animationDelay: `${index * 200}ms` }}>
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Content */}
            <div className="relative z-10">
              <div className="mb-3">
                <p className="text-white/80 text-sm font-medium">
                  {stat.label}
                </p>
              </div>
              
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-black text-white leading-none mb-1">
                    {stat.value}
                  </p>
                  <div className="flex items-center space-x-1">
                    <div className="flex items-center space-x-1 px-2 py-0.5 bg-white/20 rounded-full">
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-xs font-bold">{stat.trend}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress indicator */}
              <div className="mt-3">
                <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min((index + 1) * 25, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Shimmer effect */}
            <div className="absolute inset-0 -top-2 -left-2 bg-gradient-to-r from-transparent via-white/10 to-transparent transform rotate-12 w-6 animate-gradient-shift"></div>
          </div>
        )
      })}
    </div>
  )
}