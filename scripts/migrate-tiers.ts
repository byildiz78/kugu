import { PrismaClient } from '@prisma/client'
import { tierService } from '@/lib/services/tier.service'

const prisma = new PrismaClient()

async function migrateTiers() {
  try {
    console.log('🔄 Migrating customers to new tier system...')
    
    // Get default restaurant ID
    const restaurant = await prisma.restaurant.findFirst()
    if (!restaurant) {
      throw new Error('No restaurant found')
    }

    // Migrate legacy levels to new tier system
    await tierService.migrateLegacyLevels(restaurant.id)
    
    // After migration, check all customers for proper tier assignment
    const customers = await prisma.customer.findMany({
      include: { tier: true }
    })

    console.log('🔍 Checking tier assignments after migration...')
    
    for (const customer of customers) {
      console.log(`Checking customer ${customer.name} (${customer.email})`)
      console.log(`  Stats: ${customer.totalSpent}₺, ${customer.visitCount} visits, ${customer.points} points`)
      console.log(`  Current tier: ${customer.tier?.displayName || 'None'}`)
      
      // Check and upgrade tier based on current stats
      const upgradedTier = await tierService.checkAndUpgradeTier(customer.id, 'MIGRATION_CHECK')
      
      if (upgradedTier) {
        console.log(`  ✅ Upgraded to: ${upgradedTier.displayName}`)
      } else {
        console.log(`  ✅ Already at correct tier`)
      }
    }

    console.log('✅ Migration completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateTiers()