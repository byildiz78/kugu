const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    // First, create a restaurant
    const restaurant = await prisma.restaurant.create({
      data: {
        name: 'Test Restaurant',
        address: '123 Test Street',
        phone: '+90 555 123 4567'
      }
    })

    console.log('Created restaurant:', restaurant)

    // Then create a user with the session email
    const user = await prisma.user.create({
      data: {
        email: 'admin@aircrm.com',
        name: 'Admin User',
        role: 'ADMIN',
        restaurantId: restaurant.id
      }
    })

    console.log('Created user:', user)

    // Create settings for the restaurant
    const settings = await prisma.settings.create({
      data: {
        restaurantId: restaurant.id,
        basePointRate: 0.1
      }
    })

    console.log('Created settings:', settings)

    console.log('\nTest user created successfully!')
    console.log('Email: admin@aircrm.com')
    console.log('This matches your current session email')

  } catch (error) {
    console.error('Error creating test user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()