// Direct transaction test without server
const { PrismaClient } = require('@prisma/client')

async function testTransaction() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🧪 Testing Transaction Processing...\n')
    
    // Get a customer with tier
    const customer = await prisma.customer.findFirst({
      include: { 
        tier: true,
        restaurant: { include: { settings: true } }
      }
    })
    
    if (!customer) {
      console.log('❌ No customer found!')
      return
    }
    
    console.log(`👤 Customer: ${customer.name} (${customer.email})`)
    console.log(`🏆 Tier: ${customer.tier?.displayName || 'None'} (${customer.tier?.pointMultiplier || 1.0}x multiplier)`)
    console.log(`💰 Current Points: ${customer.points}`)
    console.log(`💸 Total Spent: ${customer.totalSpent}₺`)
    console.log(`🔄 Visit Count: ${customer.visitCount}`)
    
    // Simulate transaction processing
    const finalAmount = 100
    const basePointRate = customer.restaurant.settings?.basePointRate || 0.1
    const tierPointMultiplier = customer.tier?.pointMultiplier || 1.0
    
    const pointsEarned = Math.floor(finalAmount * basePointRate * tierPointMultiplier)
    
    console.log(`\n📊 Transaction Calculation:`)
    console.log(`   Amount: ${finalAmount}₺`)
    console.log(`   Base Rate: ${basePointRate} (${basePointRate === 0.1 ? '10₺ = 1 point' : 'custom'})`)
    console.log(`   Tier Multiplier: ${tierPointMultiplier}x`)
    console.log(`   Formula: ${finalAmount} × ${basePointRate} × ${tierPointMultiplier} = ${pointsEarned} points`)
    
    // Test the actual transaction creation
    const product = await prisma.product.findFirst()
    
    if (product) {
      console.log(`\n🛒 Creating Test Transaction...`)
      
      const transaction = await prisma.transaction.create({
        data: {
          orderNumber: `TEST-${Date.now()}`,
          totalAmount: finalAmount,
          discountAmount: 0,
          finalAmount: finalAmount,
          pointsEarned: pointsEarned,
          pointsUsed: 0,
          paymentMethod: 'CARD',
          customerId: customer.id,
          items: {
            create: [{
              productId: product.id,
              productName: product.name,
              category: product.category,
              quantity: 1,
              unitPrice: product.price,
              totalPrice: product.price
            }]
          }
        },
        include: {
          items: true
        }
      })
      
      // Update customer
      const updatedCustomer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          points: { increment: pointsEarned },
          totalSpent: { increment: finalAmount },
          visitCount: { increment: 1 },
          lastVisit: new Date()
        }
      })
      
      console.log(`✅ Transaction Created Successfully!`)
      console.log(`   Order Number: ${transaction.orderNumber}`)
      console.log(`   Points Earned: ${transaction.pointsEarned}`)
      console.log(`   Customer New Points: ${updatedCustomer.points} (+${pointsEarned})`)
      console.log(`   Customer New Total Spent: ${updatedCustomer.totalSpent}₺ (+${finalAmount}₺)`)
      console.log(`   Customer New Visit Count: ${updatedCustomer.visitCount} (+1)`)
      
      // Check if tier upgrade needed
      console.log(`\n🎯 Checking Tier Requirements...`)
      const allTiers = await prisma.Tier.findMany({
        where: { restaurantId: customer.restaurantId, isActive: true },
        orderBy: { level: 'asc' }
      })
      
      let eligibleTier = null
      for (const tier of allTiers) {
        const meetsRequirements = 
          (!tier.minTotalSpent || updatedCustomer.totalSpent >= tier.minTotalSpent) &&
          (!tier.minVisitCount || updatedCustomer.visitCount >= tier.minVisitCount) &&
          (!tier.minPoints || updatedCustomer.points >= tier.minPoints)
          
        if (meetsRequirements) {
          eligibleTier = tier
        }
      }
      
      const currentTierLevel = customer.tier?.level ?? -1
      if (eligibleTier && eligibleTier.level > currentTierLevel) {
        console.log(`🚀 TIER UPGRADE AVAILABLE: ${customer.tier?.displayName || 'None'} → ${eligibleTier.displayName}`)
      } else {
        console.log(`✅ Customer stays at current tier: ${customer.tier?.displayName || 'None'}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testTransaction()