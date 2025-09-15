import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface ThemedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'surface' | 'primary' | 'secondary' | 'accent'
  noPadding?: boolean
  interactive?: boolean
}

export const ThemedCard = forwardRef<HTMLDivElement, ThemedCardProps>(
  ({ className, variant = 'surface', noPadding = false, interactive = false, ...props }, ref) => {
    const baseStyles = 'rounded-theme shadow-theme overflow-hidden transition-all'
    
    const variants = {
      surface: 'bg-theme-surface',
      primary: 'bg-theme-primary text-white',
      secondary: 'bg-theme-secondary text-white',
      accent: 'bg-theme-accent text-white'
    }
    
    const interactiveStyles = interactive 
      ? 'hover:shadow-lg cursor-pointer active:scale-[0.98]' 
      : ''
    
    const paddingStyles = !noPadding ? 'p-4' : ''
    
    return (
      <div
        className={cn(
          baseStyles,
          variants[variant],
          interactiveStyles,
          paddingStyles,
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

ThemedCard.displayName = 'ThemedCard'