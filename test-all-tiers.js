// Test all tier multipliers
const { PrismaClient } = require('@prisma/client')

async function testAllTiers() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🧪 Testing All Tier Multipliers...\n')
    
    // Get all customers with different tiers
    const customers = await prisma.customer.findMany({
      include: { 
        tier: true,
        restaurant: { include: { settings: true } }
      },
      take: 3
    })
    
    const basePointRate = 0.1 // Default rate
    const testAmount = 100    // Test with 100₺
    
    console.log(`📊 Test Parameters:`)
    console.log(`   Amount: ${testAmount}₺`)
    console.log(`   Base Rate: ${basePointRate} (10₺ = 1 point)`)
    console.log(`   Formula: amount × base_rate × tier_multiplier\n`)
    
    for (const customer of customers) {
      const tierMultiplier = customer.tier?.pointMultiplier || 1.0
      const expectedPoints = Math.floor(testAmount * basePointRate * tierMultiplier)
      
      console.log(`👤 ${customer.name}`)
      console.log(`   🏆 Tier: ${customer.tier?.displayName || 'None'} (${tierMultiplier}x multiplier)`)
      console.log(`   💰 Current Points: ${customer.points}`)
      console.log(`   🧮 Calculation: ${testAmount} × ${basePointRate} × ${tierMultiplier} = ${expectedPoints} points`)
      console.log(`   📈 After Transaction: ${customer.points + expectedPoints} points\n`)
    }
    
    // Show tier progression
    console.log('🎯 Tier Comparison for 100₺ spending:')
    const tiers = await prisma.Tier.findMany({
      where: { isActive: true },
      orderBy: { level: 'asc' }
    })
    
    tiers.forEach(tier => {
      const points = Math.floor(testAmount * basePointRate * tier.pointMultiplier)
      console.log(`   ${tier.displayName}: ${points} points (${tier.pointMultiplier}x)`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAllTiers()