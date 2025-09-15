// PWA Icon Generator Script
// Bu script gerekli tüm PWA ikonlarını oluşturur

const fs = require('fs')
const path = require('path')

// Icon sizes for PWA
const iconSizes = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 256, name: 'icon-256x256.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' }
]

// Badge icon (for notifications)
const badgeIcon = { size: 72, name: 'badge-72x72.png' }

// SVG template for main icon
function generateMainIconSVG(size, color = '#3B82F6') {
  return `<svg width="${size}" height="${size}" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="192" height="192" rx="24" fill="${color}" />
  
  <!-- Air CRM Logo -->
  <g transform="translate(32, 32)">
    <!-- Cloud shape for "Air" -->
    <path
      d="M96 48c-8.8 0-16 7.2-16 16 0 1.6.24 3.12.68 4.56-4.08 2.24-6.68 6.32-6.68 11.44 0 7.04 5.76 12.8 12.8 12.8h35.2c6.4 0 11.2-4.8 11.2-11.2s-4.8-11.2-11.2-11.2c-.64 0-1.28.08-1.92.16C118.4 54.4 107.76 48 96 48z"
      fill="white"
      opacity="0.9"
    />
    
    <!-- CRM Text -->
    <text
      x="64"
      y="104"
      text-anchor="middle"
      font-family="Arial, sans-serif"
      font-weight="bold"
      font-size="24"
      fill="white"
    >
      CRM
    </text>
    
    <!-- Mobile phone icon -->
    <rect
      x="48"
      y="112"
      width="32"
      height="20"
      rx="4"
      fill="white"
      opacity="0.8"
    />
    
    <!-- Screen -->
    <rect
      x="52"
      y="116"
      width="24"
      height="12"
      rx="2"
      fill="${color}"
    />
  </g>
</svg>`
}

// SVG template for badge icon
function generateBadgeIconSVG(size, color = '#3B82F6') {
  return `<svg width="${size}" height="${size}" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="36" cy="36" r="36" fill="${color}" />
  
  <!-- Bell icon -->
  <path
    d="M36 8c-2.2 0-4 1.8-4 4v2.3C26.4 16.1 22 21.7 22 28v12l-4 4v2h32v-2l-4-4V28c0-6.3-4.4-11.9-10-13.7V12c0-2.2-1.8-4-4-4z"
    fill="white"
  />
  
  <!-- Bell clapper -->
  <circle cx="36" cy="52" r="4" fill="white" />
</svg>`
}

// Create icons directory
const iconsDir = path.join(__dirname, '..', 'public', 'icons')
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

console.log('🎨 Generating PWA icons...')

// Generate main icons
iconSizes.forEach(({ size, name }) => {
  const svg = generateMainIconSVG(size)
  fs.writeFileSync(path.join(iconsDir, name.replace('.png', '.svg')), svg)
  console.log(`✅ Generated ${name.replace('.png', '.svg')} (${size}x${size})`)
})

// Generate badge icon
const badgeSvg = generateBadgeIconSVG(badgeIcon.size)
fs.writeFileSync(path.join(iconsDir, badgeIcon.name.replace('.png', '.svg')), badgeSvg)
console.log(`✅ Generated ${badgeIcon.name.replace('.png', '.svg')} (${badgeIcon.size}x${badgeIcon.size})`)

// Generate favicon
const faviconSvg = generateMainIconSVG(32)
fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.svg'), faviconSvg)
console.log('✅ Generated favicon.svg')

// Generate Apple touch icon
const appleTouchSvg = generateMainIconSVG(180)
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.svg'), appleTouchSvg)
console.log('✅ Generated apple-touch-icon.svg')

console.log('🎉 All PWA icons generated successfully!')
console.log(`📁 Icons saved to: ${iconsDir}`)

// Instructions for converting to PNG
console.log(`
📝 Next steps:
1. Use an SVG to PNG converter or Node.js package like 'sharp' to convert SVGs to PNGs
2. Or use the SVG files directly (modern browsers support SVG icons)
3. Update manifest.json with the correct icon paths

🌐 For production, consider using a service like:
- https://realfavicongenerator.net/
- https://www.favicon-generator.org/
`)