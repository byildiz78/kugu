'use client'

// PWA Icon Generator Component
// Bu component SVG ile dinamik ikonlar oluşturur

interface IconGeneratorProps {
  size: number
  color?: string
  className?: string
}

export function PWAIcon({ size, color = '#3B82F6', className = '' }: IconGeneratorProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 192 192" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <rect width="192" height="192" rx="24" fill={color} />
      
      {/* Air CRM Logo */}
      <g transform="translate(32, 32)">
        {/* Cloud shape for "Air" */}
        <path
          d="M96 48c-8.8 0-16 7.2-16 16 0 1.6.24 3.12.68 4.56-4.08 2.24-6.68 6.32-6.68 11.44 0 7.04 5.76 12.8 12.8 12.8h35.2c6.4 0 11.2-4.8 11.2-11.2s-4.8-11.2-11.2-11.2c-.64 0-1.28.08-1.92.16C118.4 54.4 107.76 48 96 48z"
          fill="white"
          opacity="0.9"
        />
        
        {/* CRM Text */}
        <text
          x="64"
          y="104"
          textAnchor="middle"
          className="font-bold text-white"
          fontSize="24"
          fill="white"
        >
          CRM
        </text>
        
        {/* Mobile phone icon */}
        <rect
          x="48"
          y="112"
          width="32"
          height="20"
          rx="4"
          fill="white"
          opacity="0.8"
        />
        
        {/* Screen */}
        <rect
          x="52"
          y="116"
          width="24"
          height="12"
          rx="2"
          fill={color}
        />
      </g>
    </svg>
  )
}

export function BadgeIcon({ size, color = '#3B82F6', className = '' }: IconGeneratorProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 72 72" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circle */}
      <circle cx="36" cy="36" r="36" fill={color} />
      
      {/* Bell icon */}
      <path
        d="M36 8c-2.2 0-4 1.8-4 4v2.3C26.4 16.1 22 21.7 22 28v12l-4 4v2h32v-2l-4-4V28c0-6.3-4.4-11.9-10-13.7V12c0-2.2-1.8-4-4-4z"
        fill="white"
      />
      
      {/* Bell clapper */}
      <circle cx="36" cy="52" r="4" fill="white" />
    </svg>
  )
}