import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Admin kullanıcısı oluştur
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@aircrm.com' },
    update: {},
    create: {
      email: 'admin@aircrm.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN'
    }
  })

  // Test restoranı oluştur
  const restaurant = await prisma.restaurant.upsert({
    where: { id: 'default-restaurant-id' },
    update: {},
    create: {
      id: 'default-restaurant-id',
      name: 'Air Restaurant',
      address: 'İstanbul, Türkiye',
      phone: '0212 123 45 67'
    }
  })

  // Test müşterileri oluştur
  const customers = [
    {
      name: 'Ahmet Yılmaz',
      email: 'ahmet@example.com',
      phone: '0555 123 45 67',
      points: 150,
      level: 'BRONZE',
      restaurantId: restaurant.id
    },
    {
      name: 'Ayşe Demir',
      email: 'ayse@example.com',
      phone: '0555 234 56 78',
      points: 320,
      level: 'SILVER',
      restaurantId: restaurant.id
    },
    {
      name: 'Mehmet Kaya',
      email: 'mehmet@example.com',
      phone: '0555 345 67 89',
      points: 580,
      level: 'GOLD',
      restaurantId: restaurant.id
    },
    {
      name: 'Fatma Özkan',
      email: 'fatma@example.com',
      phone: '0555 456 78 90',
      points: 45,
      level: 'REGULAR',
      restaurantId: restaurant.id
    },
    {
      name: 'Ali Çelik',
      email: 'ali@example.com',
      phone: '0555 567 89 01',
      points: 1250,
      level: 'PLATINUM',
      restaurantId: restaurant.id
    }
  ]

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { email: customer.email },
      update: {},
      create: {
        ...customer,
        level: customer.level as any,
        birthDate: new Date(1990 + Math.floor(Math.random() * 20), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        lastVisit: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        totalSpent: Math.floor(Math.random() * 2000) + 100,
        visitCount: Math.floor(Math.random() * 20) + 1
      }
    })
  }

  // Test segmentleri oluştur
  const segments = [
    {
      name: 'VIP Müşteriler',
      description: '500+ puan sahibi müşteriler',
      restaurantId: restaurant.id,
      isAutomatic: true,
      criteria: JSON.stringify({
        averageOrderValue: { min: 700 },
        purchaseCount: { min: 20 },
        period: 'last_90_days'
      })
    },
    {
      name: 'Yeni Müşteriler',
      description: 'Son 30 gün içinde kayıt olan müşteriler',
      restaurantId: restaurant.id,
      isAutomatic: false
    },
    {
      name: 'Aktif Müşteriler',
      description: 'Son 7 gün içinde ziyaret eden müşteriler',
      restaurantId: restaurant.id,
      isAutomatic: true,
      criteria: JSON.stringify({
        daysSinceLastPurchase: { max: 7 },
        period: 'last_30_days'
      })
    }
  ]

  for (const segment of segments) {
    await prisma.segment.upsert({
      where: { 
        name_restaurantId: {
          name: segment.name,
          restaurantId: segment.restaurantId
        }
      },
      update: {},
      create: segment
    })
  }

  // Test ürünlerini oluştur
  const products = [
    { name: 'Margherita Pizza', description: 'Domates sosu, mozzarella', category: 'Pizza', price: 85, restaurantId: restaurant.id },
    { name: 'Pepperoni Pizza', description: 'Domates sosu, mozzarella, pepperoni', category: 'Pizza', price: 95, restaurantId: restaurant.id },
    { name: 'Vejetaryen Pizza', description: 'Sebzeli özel pizza', category: 'Pizza', price: 90, restaurantId: restaurant.id },
    { name: 'Burger', description: 'Et burger, özel sos', category: 'Burger', price: 120, restaurantId: restaurant.id },
    { name: 'Cheeseburger', description: 'Et burger, peynir, özel sos', category: 'Burger', price: 130, restaurantId: restaurant.id },
    { name: 'Tavuk Burger', description: 'Tavuk burger, marul, domates', category: 'Burger', price: 110, restaurantId: restaurant.id },
    { name: 'Sezar Salata', description: 'Marul, parmesan, kruton', category: 'Salata', price: 65, restaurantId: restaurant.id },
    { name: 'Akdeniz Salata', description: 'Domates, salatalık, beyaz peynir', category: 'Salata', price: 55, restaurantId: restaurant.id },
    { name: 'Kola', description: '330ml', category: 'İçecek', price: 20, restaurantId: restaurant.id },
    { name: 'Ayran', description: '300ml', category: 'İçecek', price: 15, restaurantId: restaurant.id },
    { name: 'Su', description: '500ml', category: 'İçecek', price: 10, restaurantId: restaurant.id },
    { name: 'Cheesecake', description: 'Frambuazlı cheesecake', category: 'Tatlı', price: 55, restaurantId: restaurant.id },
    { name: 'Tiramisu', description: 'İtalyan tatlısı', category: 'Tatlı', price: 60, restaurantId: restaurant.id }
  ]

  for (const product of products) {
    try {
      await prisma.product.create({
        data: product
      })
    } catch (error) {
      // Ignore duplicate errors
      console.log(`Product ${product.name} already exists, skipping...`)
    }
  }

  // Test kampanyaları oluştur
  const campaigns = [
    {
      name: 'Yaz İndirimi',
      description: 'Yaz aylarında geçerli özel indirim kampanyası',
      type: 'DISCOUNT',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 gün sonra
      discountType: 'PERCENTAGE',
      discountValue: 20,
      minPurchase: 100,
      maxUsagePerCustomer: 3,
      sendNotification: true,
      notificationTitle: 'Yaz İndirimi Başladı!',
      notificationMessage: '%20 indirim fırsatını kaçırmayın!',
      restaurantId: restaurant.id
    },
    {
      name: 'Happy Hour',
      description: '14:00-17:00 arası özel indirim',
      type: 'TIME_BASED',
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 gün sonra
      discountType: 'PERCENTAGE',
      discountValue: 30,
      validHours: JSON.stringify({ start: '14:00', end: '17:00' }),
      maxUsagePerCustomer: 1,
      sendNotification: true,
      restaurantId: restaurant.id
    },
    {
      name: 'VIP Özel',
      description: 'VIP müşteriler için özel kampanya',
      type: 'DISCOUNT',
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 gün sonra
      discountType: 'FIXED_AMOUNT',
      discountValue: 50,
      minPurchase: 200,
      maxUsagePerCustomer: 5,
      sendNotification: true,
      restaurantId: restaurant.id
    }
  ]

  for (const campaign of campaigns) {
    try {
      await prisma.campaign.create({
        data: campaign
      })
    } catch (error) {
      console.log(`Campaign ${campaign.name} already exists, skipping...`)
    }
  }

  // Test işlemleri oluştur
  const allCustomers = await prisma.customer.findMany()
  const allProducts = await prisma.product.findMany()
  
  for (const customer of allCustomers) {
    const transactionCount = Math.floor(Math.random() * 5) + 1
    
    for (let i = 0; i < transactionCount; i++) {
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase()
      const itemCount = Math.floor(Math.random() * 3) + 1
      let totalAmount = 0
      const transactionItems = []
      
      for (let j = 0; j < itemCount; j++) {
        const product = allProducts[Math.floor(Math.random() * allProducts.length)]
        const quantity = Math.floor(Math.random() * 2) + 1
        const itemTotal = product.price * quantity
        totalAmount += itemTotal
        
        transactionItems.push({
          productId: product.id,
          productName: product.name,
          category: product.category,
          quantity,
          unitPrice: product.price,
          totalPrice: itemTotal
        })
      }
      
      const pointsEarned = Math.floor(totalAmount / 10)
      
      await prisma.transaction.create({
        data: {
          orderNumber,
          totalAmount,
          discountAmount: 0,
          finalAmount: totalAmount,
          pointsEarned,
          pointsUsed: 0,
          paymentMethod: ['CASH', 'CARD', 'MOBILE'][Math.floor(Math.random() * 3)],
          customerId: customer.id,
          transactionDate: new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000),
          items: {
            create: transactionItems
          }
        }
      })
    }
  }

  // Test ödülleri oluştur
  const rewards = [
    {
      name: '10₺ İndirim Kuponu',
      description: 'Bir sonraki alışverişinizde 10₺ indirim',
      type: 'INSTANT',
      category: 'discount',
      pointsCost: 100,
      value: JSON.stringify({ discountAmount: 10, discountType: 'FIXED_AMOUNT' }),
      restaurantId: restaurant.id,
      validityDays: 30,
      maxRedemptions: 100,
      maxPerCustomer: 3,
      minTier: 'REGULAR'
    },
    {
      name: 'Bedava İçecek',
      description: 'Herhangi bir içecek bedava',
      type: 'INSTANT',
      category: 'free_item',
      pointsCost: 150,
      value: JSON.stringify({ freeCategory: 'İçecek', maxValue: 25 }),
      restaurantId: restaurant.id,
      validityDays: 15,
      maxRedemptions: 50,
      maxPerCustomer: 2,
      minTier: 'BRONZE'
    },
    {
      name: '%20 İndirim',
      description: 'Tüm siparişte %20 indirim',
      type: 'INSTANT',
      category: 'discount',
      pointsCost: 300,
      value: JSON.stringify({ discountAmount: 20, discountType: 'PERCENTAGE' }),
      restaurantId: restaurant.id,
      validityDays: 7,
      maxRedemptions: 25,
      maxPerCustomer: 1,
      minTier: 'SILVER'
    },
    {
      name: 'VIP Ödül',
      description: 'Özel VIP müşteri ödülü',
      type: 'MILESTONE',
      category: 'special',
      value: JSON.stringify({ specialAccess: true, vipTreatment: true }),
      restaurantId: restaurant.id,
      maxPerCustomer: 1,
      minTier: 'GOLD'
    }
  ]

  for (const reward of rewards) {
    try {
      await prisma.reward.create({
        data: reward
      })
    } catch (error) {
      console.log(`Reward ${reward.name} already exists, skipping...`)
    }
  }

  // Test ödül kuralları oluştur
  const allRewards = await prisma.reward.findMany()
  
  const rewardRules = [
    {
      rewardId: allRewards[0].id, // 10₺ İndirim
      triggerType: 'VISIT_COUNT',
      triggerValue: 5,
      periodType: 'LIFETIME',
      isActive: true
    },
    {
      rewardId: allRewards[1].id, // Bedava İçecek
      triggerType: 'TOTAL_SPENT',
      triggerValue: 500,
      periodType: 'LIFETIME',
      isActive: true
    },
    {
      rewardId: allRewards[2].id, // %20 İndirim
      triggerType: 'POINTS_MILESTONE',
      triggerValue: 1000,
      periodType: 'LIFETIME',
      isActive: true
    },
    {
      rewardId: allRewards[3].id, // VIP Ödül
      triggerType: 'TIER_REACHED',
      triggerValue: 3, // GOLD level
      periodType: 'LIFETIME',
      isActive: true
    }
  ]

  for (const rule of rewardRules) {
    try {
      await prisma.rewardRule.create({
        data: rule
      })
    } catch (error) {
      console.log('RewardRule already exists, skipping...')
    }
  }

  // Test puan geçmişi oluştur
  const allCustomersAfter = await prisma.customer.findMany()
  
  for (const customer of allCustomersAfter) {
    // Her müşteri için birkaç puan işlemi oluştur
    const earnedPoints1 = Math.floor(Math.random() * 100) + 50
    const earnedPoints2 = Math.floor(Math.random() * 50) + 25
    const spentPoints = Math.floor(Math.random() * 30) + 10
    
    let currentBalance = 0 // Balance tracking
    
    const pointTransactions = [
      {
        customerId: customer.id,
        amount: earnedPoints1,
        type: 'EARNED',
        source: 'PURCHASE',
        description: 'Alışveriş puanı',
        balance: currentBalance + earnedPoints1,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 yıl sonra
      },
      {
        customerId: customer.id,
        amount: earnedPoints2,
        type: 'EARNED',
        source: 'BONUS',
        description: 'Bonus puan',
        balance: currentBalance + earnedPoints1 + earnedPoints2,
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // 6 ay sonra
      }
    ]

    currentBalance = currentBalance + earnedPoints1 + earnedPoints2

    // Bazı müşteriler için puan harcama işlemi
    if (Math.random() > 0.5) {
      pointTransactions.push({
        customerId: customer.id,
        amount: -spentPoints,
        type: 'SPENT',
        source: 'REWARD',
        description: 'Ödül kullanımı',
        balance: currentBalance - spentPoints
      })
    }

    for (const transaction of pointTransactions) {
      await prisma.pointHistory.create({
        data: transaction
      })
    }
  }

  // Test tier'ları oluştur
  const tiers = [
    {
      name: 'regular',
      displayName: 'Standart',
      description: 'Yeni müşteriler için başlangıç seviyesi',
      color: '#6B7280',
      gradient: 'from-gray-400 to-gray-500',
      icon: 'users',
      minTotalSpent: null,
      minVisitCount: null,
      minPoints: null,
      level: 0,
      pointMultiplier: 1.0,
      discountPercent: null,
      specialFeatures: null,
      isActive: true,
      restaurantId: restaurant.id
    },
    {
      name: 'bronze',
      displayName: 'Bronz',
      description: 'İlk seviye sadık müşteri',
      color: '#CD7F32',
      gradient: 'from-amber-400 to-orange-500',
      icon: 'award',
      minTotalSpent: 500,
      minVisitCount: 5,
      minPoints: null,
      level: 1,
      pointMultiplier: 1.5,
      discountPercent: 5,
      specialFeatures: JSON.stringify({ earlyAccess: false, prioritySupport: false }),
      isActive: true,
      restaurantId: restaurant.id
    },
    {
      name: 'silver',
      displayName: 'Gümüş',
      description: 'Orta seviye sadık müşteri',
      color: '#C0C0C0',
      gradient: 'from-slate-400 to-slate-500',
      icon: 'star',
      minTotalSpent: 1500,
      minVisitCount: 15,
      minPoints: 200,
      level: 2,
      pointMultiplier: 2.0,
      discountPercent: 10,
      specialFeatures: JSON.stringify({ earlyAccess: true, prioritySupport: false }),
      isActive: true,
      restaurantId: restaurant.id
    },
    {
      name: 'gold',
      displayName: 'Altın',
      description: 'Yüksek seviye sadık müşteri',
      color: '#FFD700',
      gradient: 'from-yellow-400 to-yellow-600',
      icon: 'crown',
      minTotalSpent: 5000,
      minVisitCount: 30,
      minPoints: 750,
      level: 3,
      pointMultiplier: 3.0,
      discountPercent: 15,
      specialFeatures: JSON.stringify({ earlyAccess: true, prioritySupport: true, freeDelivery: true }),
      isActive: true,
      restaurantId: restaurant.id
    },
    {
      name: 'platinum',
      displayName: 'Platin',
      description: 'En üst seviye VIP müşteri',
      color: '#E5E4E2',
      gradient: 'from-purple-400 to-purple-600',
      icon: 'crown',
      minTotalSpent: 15000,
      minVisitCount: 50,
      minPoints: 2000,
      level: 4,
      pointMultiplier: 5.0,
      discountPercent: 20,
      specialFeatures: JSON.stringify({ 
        earlyAccess: true, 
        prioritySupport: true, 
        freeDelivery: true,
        personalManager: true,
        exclusiveEvents: true
      }),
      isActive: true,
      restaurantId: restaurant.id
    }
  ]

  for (const tier of tiers) {
    try {
      await prisma.tier.create({
        data: tier
      })
    } catch (error) {
      console.log(`Tier ${tier.displayName} already exists, skipping...`)
    }
  }

  // Test settings oluştur
  try {
    await prisma.settings.create({
      data: {
        restaurantId: restaurant.id,
        basePointRate: 0.1 // Default: 10 TL = 1 point
      }
    })
  } catch (error) {
    console.log('Settings already exists, skipping...')
  }

  console.log('✅ Seed data created successfully!')
  console.log('📧 Admin Email: admin@aircrm.com')
  console.log('🔑 Admin Password: admin123')
  console.log('🎁 Created rewards and reward rules')
  console.log('📊 Created point history records')
  console.log('👑 Created tier system with 5 levels')
  console.log('⚙️ Created default settings with base point rate')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })