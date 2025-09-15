// Check current tier multipliers in database
const { PrismaClient } = require('@prisma/client')

async function checkTiers() {
  const prisma = new PrismaClient()
  
  try {
    const tiers = await prisma.Tier.findMany({
      orderBy: { level: 'asc' }
    })
    
    console.log('📊 Current Tier Multipliers in Database:')
    tiers.forEach(tier => {
      console.log(`   ${tier.displayName} (Level ${tier.level}): ${tier.pointMultiplier}x multiplier`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTiers()