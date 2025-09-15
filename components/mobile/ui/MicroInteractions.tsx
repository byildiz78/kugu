'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Haptic feedback hook
export function useHapticFeedback() {
  const vibrate = (pattern: number | number[] = 50) => {
    if ('navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  return {
    light: () => vibrate(25),
    medium: () => vibrate(50),
    heavy: () => vibrate(100),
    success: () => vibrate([50, 50, 100]),
    error: () => vibrate([100, 50, 100, 50, 100])
  }
}

// Ripple effect component
export function RippleButton({ 
  children, 
  onClick, 
  className = '',
  disabled = false,
  ...props 
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
  [key: string]: any
}) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([])
  const buttonRef = useRef<HTMLButtonElement>(null)
  const haptic = useHapticFeedback()

  const createRipple = (event: React.MouseEvent) => {
    if (disabled) return

    const button = buttonRef.current
    if (!button) return

    const rect = button.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const newRipple = {
      id: Date.now(),
      x,
      y
    }

    setRipples(prev => [...prev, newRipple])
    haptic.light()

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id))
    }, 600)

    onClick?.()
  }

  return (
    <button
      ref={buttonRef}
      onClick={createRipple}
      disabled={disabled}
      className={`relative overflow-hidden ${className}`}
      {...props}
    >
      {children}
      
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 animate-ping"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
            animation: 'ripple 0.6s linear'
          }}
        />
      ))}
    </button>
  )
}

// Bounce animation wrapper
export function BounceWrapper({ 
  children, 
  delay = 0,
  className = ''
}: { 
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 200, 
        damping: 10,
        delay 
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Slide in animation
export function SlideIn({ 
  children, 
  direction = 'left',
  delay = 0,
  className = ''
}: { 
  children: React.ReactNode
  direction?: 'left' | 'right' | 'up' | 'down'
  delay?: number
  className?: string
}) {
  const variants = {
    left: { x: -50, opacity: 0 },
    right: { x: 50, opacity: 0 },
    up: { y: -50, opacity: 0 },
    down: { y: 50, opacity: 0 }
  }

  return (
    <motion.div
      initial={variants[direction]}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 100, 
        damping: 15,
        delay 
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Pulse animation for notifications
export function PulseWrapper({ 
  children, 
  isActive = false,
  className = ''
}: { 
  children: React.ReactNode
  isActive?: boolean
  className?: string
}) {
  return (
    <motion.div
      animate={isActive ? { scale: [1, 1.05, 1] } : {}}
      transition={{ 
        duration: 0.6, 
        repeat: isActive ? Infinity : 0,
        repeatDelay: 1
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Success checkmark animation
export function SuccessCheckmark({ 
  isVisible = false,
  size = 24,
  color = '#10B981'
}: {
  isVisible?: boolean
  size?: number
  color?: string
}) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="flex items-center justify-center"
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <motion.path
              d="M20 6L9 17l-5-5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Loading dots animation
export function LoadingDots({ 
  size = 4,
  color = 'var(--color-primary)'
}: {
  size?: number
  color?: string
}) {
  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="rounded-full"
          style={{ 
            width: size, 
            height: size, 
            backgroundColor: color 
          }}
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ 
            duration: 0.8, 
            repeat: Infinity,
            delay: i * 0.2
          }}
        />
      ))}
    </div>
  )
}

// Shake animation for errors
export function ShakeWrapper({ 
  children, 
  trigger = false,
  className = ''
}: { 
  children: React.ReactNode
  trigger?: boolean
  className?: string
}) {
  return (
    <motion.div
      animate={trigger ? { x: [-5, 5, -5, 5, 0] } : {}}
      transition={{ duration: 0.4 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Count up animation for numbers
export function CountUp({ 
  from = 0,
  to,
  duration = 1,
  className = ''
}: {
  from?: number
  to: number
  duration?: number
  className?: string
}) {
  const [count, setCount] = useState(from)

  useEffect(() => {
    if (to === from) return

    const increment = (to - from) / (duration * 60) // 60 FPS
    let current = from
    
    const timer = setInterval(() => {
      current += increment
      if ((increment > 0 && current >= to) || (increment < 0 && current <= to)) {
        setCount(to)
        clearInterval(timer)
      } else {
        setCount(Math.round(current))
      }
    }, 1000 / 60)

    return () => clearInterval(timer)
  }, [to, from, duration])

  return <span className={className}>{count.toLocaleString('tr-TR')}</span>
}

// Floating action button with micro-interactions
export function FloatingActionButton({
  onClick,
  icon,
  label,
  position = 'bottom-right',
  className = ''
}: {
  onClick: () => void
  icon: React.ReactNode
  label?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  className?: string
}) {
  const [isHovered, setIsHovered] = useState(false)
  const haptic = useHapticFeedback()

  const positions = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  }

  const handleClick = () => {
    haptic.medium()
    onClick()
  }

  return (
    <motion.button
      onClick={handleClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={`
        fixed ${positions[position]} z-50
        bg-theme-primary text-white rounded-full
        w-14 h-14 flex items-center justify-center
        shadow-lg hover:shadow-xl transition-shadow
        ${className}
      `}
    >
      <motion.div
        animate={{ rotate: isHovered ? 180 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {icon}
      </motion.div>
      
      {label && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ 
            opacity: isHovered ? 1 : 0,
            x: isHovered ? -60 : 10
          }}
          className="absolute right-full mr-3 bg-gray-800 text-white px-2 py-1 rounded text-sm whitespace-nowrap"
        >
          {label}
        </motion.div>
      )}
    </motion.button>
  )
}