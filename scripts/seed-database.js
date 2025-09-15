const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create default restaurant if not exists
  const restaurant = await prisma.restaurant.upsert({
    where: { id: 'default-restaurant-id' },
    update: {},
    create: {
      id: 'default-restaurant-id',
      name: 'Demo Restaurant',
      address: '123 Demo Street',
      phone: '+90 555 123 4567',
      logo: '/logo.png'
    }
  })

  console.log('Created restaurant:', restaurant.name)

  // Create default theme if not exists
  const defaultTheme = await prisma.customTheme.upsert({
    where: {
      restaurantId_name: {
        restaurantId: 'default-restaurant-id',
        name: 'Default Theme'
      }
    },
    update: {},
    create: {
      restaurantId: 'default-restaurant-id',
      name: 'Default Theme',
      description: 'Default theme for mobile app',
      isDefault: true,
      isActive: true,
      config: {
        primary: '#FF6B6B',
        secondary: '#4ECDC4',
        accent: '#45B7D1',
        success: '#95E1D3',
        warning: '#FFA07A',
        error: '#FF6B6B',
        info: '#87CEEB',
        background: '#F7F9FC',
        surface: '#FFFFFF',
        textPrimary: '#2C3E50',
        textSecondary: '#7F8C8D',
        textDisabled: '#BDC3C7',
        border: '#E1E8ED',
        primaryGradient: 'from-red-500 to-red-600',
        secondaryGradient: 'from-teal-500 to-teal-600',
        accentGradient: 'from-cyan-500 to-cyan-600'
      }
    }
  })

  console.log('Created default theme:', defaultTheme.name)

  // Create a demo customer
  const customer = await prisma.customer.upsert({
    where: { email: 'demo@customer.com' },
    update: {},
    create: {
      email: 'demo@customer.com',
      name: 'Demo Customer',
      phone: '+90 555 987 6543',
      points: 250,
      level: 'SILVER',
      restaurantId: 'default-restaurant-id',
      totalSpent: 1500,
      visitCount: 12
    }
  })

  console.log('Created demo customer:', customer.name)

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })