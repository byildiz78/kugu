import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface ThemedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'link'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

export const ThemedButton = forwardRef<HTMLButtonElement, ThemedButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth = false, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 rounded-theme'
    
    const variants = {
      primary: 'bg-theme-primary text-white hover:bg-theme-primary-dark focus-visible:ring-theme-primary',
      secondary: 'bg-theme-secondary text-white hover:opacity-90 focus-visible:ring-theme-secondary',
      accent: 'bg-theme-accent text-white hover:opacity-90 focus-visible:ring-theme-accent',
      outline: 'border-2 border-theme-primary text-theme-primary hover:bg-theme-primary hover:text-white focus-visible:ring-theme-primary',
      ghost: 'hover:bg-theme-primary/10 text-theme-primary focus-visible:ring-theme-primary',
      link: 'text-theme-primary underline-offset-4 hover:underline focus-visible:ring-theme-primary'
    }
    
    const sizes = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-11 px-4 text-base',
      lg: 'h-12 px-6 text-lg'
    }
    
    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

ThemedButton.displayName = 'ThemedButton'