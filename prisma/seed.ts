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

  // Settings oluştur
  await prisma.settings.upsert({
    where: { restaurantId: restaurant.id },
    update: {},
    create: {
      restaurantId: restaurant.id,
      basePointRate: 0.1 // 10 TL = 1 puan
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
      name: 'Fatma Öz',
      email: 'fatma@example.com',
      phone: '0555 456 78 90',
      points: 50,
      level: 'REGULAR',
      restaurantId: restaurant.id
    }
  ]

  for (const customer of customers) {
    try {
      await prisma.customer.create({
        data: customer
      })
    } catch (error) {
      console.log(`Customer ${customer.name} already exists, skipping...`)
    }
  }

  // Test segmentleri oluştur
  const segments = [
    {
      name: 'VIP Müşteriler',
      description: '500 puan üstü müşteriler',
      isAutomatic: true,
      criteria: JSON.stringify({ minPoints: 500 }),
      restaurantId: restaurant.id
    },
    {
      name: 'Aktif Müşteriler',
      description: 'Son 30 günde alışveriş yapan müşteriler',
      isAutomatic: true,
      criteria: JSON.stringify({ lastVisitDays: 30 }),
      restaurantId: restaurant.id
    },
    {
      name: 'Yeni Müşteriler',
      description: 'Son 7 gün içinde kayıt olan müşteriler',
      isAutomatic: true,
      criteria: JSON.stringify({ registeredDays: 7 }),
      restaurantId: restaurant.id
    }
  ]

  for (const segment of segments) {
    try {
      await prisma.segment.create({
        data: segment
      })
    } catch (error) {
      console.log(`Segment ${segment.name} already exists, skipping...`)
    }
  }

  // Tier'ları oluştur
  const tiers = [
    {
      name: 'REGULAR',
      displayName: 'Regular',
      description: 'Başlangıç seviyesi',
      color: '#6B7280',
      gradient: 'from-gray-400 to-gray-500',
      icon: 'User',
      level: 0,
      pointMultiplier: 1.0,
      isActive: true,
      restaurantId: restaurant.id
    },
    {
      name: 'BRONZE',
      displayName: 'Bronz',
      description: '100 puan ve üzeri',
      color: '#CD7F32',
      gradient: 'from-amber-600 to-orange-600',
      icon: 'Award',
      minPoints: 100,
      level: 1,
      pointMultiplier: 1.2,
      discountPercent: 5,
      isActive: true,
      restaurantId: restaurant.id
    },
    {
      name: 'SILVER',
      displayName: 'Gümüş',
      description: '250 puan ve üzeri',
      color: '#C0C0C0',
      gradient: 'from-slate-400 to-slate-600',
      icon: 'Medal',
      minPoints: 250,
      level: 2,
      pointMultiplier: 1.5,
      discountPercent: 10,
      isActive: true,
      restaurantId: restaurant.id
    },
    {
      name: 'GOLD',
      displayName: 'Altın',
      description: '500 puan ve üzeri',
      color: '#FFD700',
      gradient: 'from-yellow-400 to-yellow-600',
      icon: 'Crown',
      minPoints: 500,
      level: 3,
      pointMultiplier: 2.0,
      discountPercent: 15,
      isActive: true,
      restaurantId: restaurant.id
    },
    {
      name: 'PLATINUM',
      displayName: 'Platin',
      description: '1000 puan ve üzeri',
      color: '#9333EA',
      gradient: 'from-purple-400 to-purple-600',
      icon: 'Gem',
      minPoints: 1000,
      level: 4,
      pointMultiplier: 3.0,
      discountPercent: 20,
      specialFeatures: JSON.stringify(['priority_support', 'exclusive_events', 'early_access']),
      isActive: true,
      restaurantId: restaurant.id
    }
  ]

  for (const tier of tiers) {
    try {
      await prisma.tier.upsert({
        where: { 
          level_restaurantId: { 
            level: tier.level, 
            restaurantId: tier.restaurantId 
          } 
        },
        update: {},
        create: tier
      })
    } catch (error) {
      console.log(`Tier ${tier.name} already exists, skipping...`)
    }
  }

  // Test ürünleri oluştur
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
      console.log(`Product ${product.name} already exists, skipping...`)
    }
  }

  // Kola ürününün ID'sini al
  const kolaProduct = await prisma.product.findFirst({
    where: { 
      name: 'Kola',
      restaurantId: restaurant.id 
    }
  })

  // Yeni kampanyaları oluştur
  const campaigns = [
    {
      name: 'Hoşgeldin Kampanyası',
      description: 'Yeni müşterilere özel %25 indirim',
      type: 'DISCOUNT',
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 ay
      isActive: true,
      discountType: 'PERCENTAGE',
      discountValue: 25,
      maxUsagePerCustomer: 1,
      maxUsage: 1000,
      sendNotification: true,
      notificationTitle: 'Hoşgeldiniz!',
      notificationMessage: 'İlk siparişinizde %25 indirim kazandınız!',
      restaurantId: restaurant.id
    },
    {
      name: '5 Al 6. Bedava - Kola',
      description: 'Kola alımlarında 5 al 6. bedava',
      type: 'BUY_X_GET_Y',
      startDate: new Date(),
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 ay
      isActive: true,
      discountType: 'FREE_ITEM',
      discountValue: 100,
      buyQuantity: 5,
      getQuantity: 1,
      targetProducts: kolaProduct ? JSON.stringify([kolaProduct.id]) : null,
      getSpecificProduct: kolaProduct?.id || null,
      sendNotification: true,
      notificationTitle: '5 Al 6. Bedava!',
      notificationMessage: 'Kola alışverişlerinizde 5 al 6. bedava kampanyası!',
      restaurantId: restaurant.id
    },
    {
      name: '1000 TL Üzeri 50 TL İndirim',
      description: '1000₺ ve üzeri alışverişlerde 50₺ indirim',
      type: 'DISCOUNT',
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 2 ay
      isActive: true,
      discountType: 'FIXED_AMOUNT',
      discountValue: 50,
      minPurchase: 1000,
      maxUsagePerCustomer: 3,
      sendNotification: true,
      notificationTitle: 'Büyük Alışverişe Büyük İndirim!',
      notificationMessage: '1000₺ üzeri alışverişlerinizde 50₺ indirim!',
      restaurantId: restaurant.id
    },
    {
      name: 'Doğum Günü İndirimi',
      description: 'Doğum gününüzde %30 indirim',
      type: 'BIRTHDAY_SPECIAL',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 yıl
      isActive: true,
      discountType: 'PERCENTAGE',
      discountValue: 30,
      maxUsagePerCustomer: 1,
      sendNotification: true,
      notificationTitle: 'Doğum Gününüz Kutlu Olsun!',
      notificationMessage: 'Doğum gününüze özel %30 indirim hediyemiz!',
      restaurantId: restaurant.id
    },
    {
      name: 'Puan Kampanyası',
      description: 'Her 100₺ alışverişe 2x puan',
      type: 'LOYALTY_POINTS',
      startDate: new Date(),
      endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 4 ay
      isActive: true,
      discountType: 'PERCENTAGE',
      discountValue: 0,
      pointsMultiplier: 2.0,
      minPurchase: 100,
      sendNotification: true,
      notificationTitle: '2x Puan Kazanın!',
      notificationMessage: '100₺ ve üzeri alışverişlerinizde 2 kat puan!',
      restaurantId: restaurant.id
    }
  ]

  const createdCampaigns = []
  for (const campaign of campaigns) {
    try {
      const created = await prisma.campaign.create({
        data: campaign
      })
      createdCampaigns.push(created)
      console.log(`Created campaign: ${campaign.name}`)
    } catch (error) {
      console.log(`Campaign ${campaign.name} already exists, skipping...`)
    }
  }

  // Kampanyalara bağlı ödülleri oluştur
  const rewards = [
    {
      name: 'Hoşgeldin İndirimi - %25',
      description: 'Yeni müşterilere özel %25 indirim kuponu',
      type: 'INSTANT',
      category: 'discount',
      value: JSON.stringify({ discountAmount: 25, discountType: 'PERCENTAGE' }),
      restaurantId: restaurant.id,
      validityDays: 30,
      maxRedemptions: 1000,
      maxPerCustomer: 1,
      campaignId: createdCampaigns.find(c => c.name === 'Hoşgeldin Kampanyası')?.id || null
    },
    {
      name: 'Bedava Kola',
      description: '5 Kola alana 1 bedava',
      type: 'INSTANT',
      category: 'free_item',
      value: JSON.stringify({ freeProduct: kolaProduct?.id, quantity: 1 }),
      restaurantId: restaurant.id,
      validityDays: 180,
      maxRedemptions: 500,
      campaignId: createdCampaigns.find(c => c.name === '5 Al 6. Bedava - Kola')?.id || null
    },
    {
      name: '50₺ İndirim Kuponu',
      description: '1000₺ üzeri alışverişlerde geçerli',
      type: 'INSTANT',
      category: 'discount',
      value: JSON.stringify({ discountAmount: 50, discountType: 'FIXED_AMOUNT', minPurchase: 1000 }),
      restaurantId: restaurant.id,
      validityDays: 60,
      maxRedemptions: 300,
      maxPerCustomer: 3,
      campaignId: createdCampaigns.find(c => c.name === '1000 TL Üzeri 50 TL İndirim')?.id || null
    },
    {
      name: 'Doğum Günü İndirimi - %30',
      description: 'Doğum gününe özel %30 indirim',
      type: 'MILESTONE',
      category: 'birthday',
      value: JSON.stringify({ discountAmount: 30, discountType: 'PERCENTAGE' }),
      restaurantId: restaurant.id,
      validityDays: 7, // Doğum gününden 7 gün önce/sonra kullanılabilir
      maxPerCustomer: 1,
      campaignId: createdCampaigns.find(c => c.name === 'Doğum Günü İndirimi')?.id || null
    },
    {
      name: '2x Puan Ödülü',
      description: '100₺ üzeri alışverişlerde 2 kat puan',
      type: 'INSTANT',
      category: 'points',
      value: JSON.stringify({ pointsMultiplier: 2.0, minPurchase: 100 }),
      restaurantId: restaurant.id,
      validityDays: 120,
      campaignId: createdCampaigns.find(c => c.name === 'Puan Kampanyası')?.id || null
    }
  ]

  const createdRewards = []
  for (const reward of rewards) {
    try {
      const created = await prisma.reward.create({
        data: reward
      })
      createdRewards.push(created)
      console.log(`Created reward: ${reward.name}`)
    } catch (error) {
      console.log(`Reward ${reward.name} already exists, skipping...`)
    }
  }

  // Reward Rules oluştur
  const rewardRules = [
    {
      rewardId: createdRewards.find(r => r.name === 'Hoşgeldin İndirimi - %25')?.id,
      triggerType: 'VISIT_COUNT',
      triggerValue: 1, // İlk ziyarette
      periodType: 'LIFETIME',
      isActive: true
    },
    {
      rewardId: createdRewards.find(r => r.name === '50₺ İndirim Kuponu')?.id,
      triggerType: 'TOTAL_SPENT',
      triggerValue: 1000, // 1000₺ harcamaya ulaşınca
      periodType: 'MONTHLY',
      isActive: true
    },
    {
      rewardId: createdRewards.find(r => r.name === '2x Puan Ödülü')?.id,
      triggerType: 'POINTS_MILESTONE',
      triggerValue: 500, // 500 puana ulaşınca
      periodType: 'LIFETIME',
      isActive: true
    },
    {
      rewardId: createdRewards.find(r => r.name === 'Doğum Günü İndirimi - %30')?.id,
      triggerType: 'BIRTHDAY_MONTH',
      triggerValue: 0, // Doğum ayında otomatik
      periodType: 'YEARLY',
      isActive: true
    },
    {
      rewardId: createdRewards.find(r => r.name === 'Bedava Kola')?.id,
      triggerType: 'PRODUCT_PURCHASE_COUNT',
      triggerValue: 5, // 5 Kola alınca
      categoryFilter: JSON.stringify(['İçecek']),
      periodType: 'MONTHLY',
      isActive: true
    }
  ]

  for (const rule of rewardRules) {
    if (rule.rewardId) {
      try {
        await prisma.rewardRule.create({
          data: rule as any
        })
        console.log(`Created reward rule for reward ID: ${rule.rewardId}`)
      } catch (error) {
        console.log(`Reward rule already exists, skipping...`)
      }
    }
  }

  // CampaignReward ilişkilerini oluştur
  for (const campaign of createdCampaigns) {
    const relatedReward = createdRewards.find(r => r.campaignId === campaign.id)
    if (relatedReward) {
      try {
        await prisma.campaignReward.create({
          data: {
            campaignId: campaign.id,
            rewardId: relatedReward.id,
            priority: 1
          }
        })
        console.log(`Linked campaign ${campaign.name} with reward ${relatedReward.name}`)
      } catch (error) {
        console.log(`Campaign-Reward link already exists, skipping...`)
      }
    }
  }

  // Test işlemleri oluştur
  const allCustomers = await prisma.customer.findMany()
  const allProducts = await prisma.product.findMany()
  
  for (const customer of allCustomers) {
    // Her müşteri için tier bilgisini al
    const tierMap: Record<string, string> = {
      'REGULAR': 'Regular',
      'BRONZE': 'Bronz',
      'SILVER': 'Gümüş',
      'GOLD': 'Altın',
      'PLATINUM': 'Platin'
    }
    
    const customerTier = await prisma.tier.findFirst({
      where: {
        restaurantId: restaurant.id,
        name: customer.level
      }
    })
    
    // Müşteriye tier ata
    if (customerTier) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { tierId: customerTier.id }
      })
    }
    
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
      
      // Tier bazlı puan hesaplama
      const basePointRate = 0.1 // 10 TL = 1 puan
      const tierMultiplier = customerTier?.pointMultiplier || 1.0
      const pointsEarned = Math.floor(totalAmount * basePointRate * tierMultiplier)
      
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
          tierId: customerTier?.id,
          tierMultiplier: tierMultiplier,
          transactionDate: new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000),
          items: {
            create: transactionItems
          }
        }
      })
    }
  }

  console.log('Seed data created successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })