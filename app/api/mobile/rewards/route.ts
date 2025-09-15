import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'Valid session or Bearer token required' 
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    
    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
    }

    // Get customer info for point checks
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { 
        points: true, 
        restaurantId: true,
        tier: {
          select: {
            level: true
          }
        }
      }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Get active rewards and stamp data for this restaurant
    const [rewards, stampData] = await Promise.all([
      prisma.reward.findMany({
        where: {
          restaurantId: customer.restaurantId,
          isActive: true
        },
        include: {
          customers: {
            where: { 
              customerId,
              isRedeemed: false,
              OR: [
                { expiresAt: null },
                { expiresAt: { gte: new Date() } }
              ]
            }
          }
        },
        orderBy: [
          { pointsCost: 'asc' }
        ]
      }),
      // Get stamp data by calling internal stamps API
      fetch(`http://localhost:3000/api/mobile/stamps?customerId=${customerId}`, {
        headers: {
          'Authorization': request.headers.get('Authorization') || ''
        }
      }).then(res => res.json()).catch(() => ({ stamps: [] }))
    ])

    // Helper function to convert tier enum to numeric value
    const getTierNumericValue = (tier: string): number => {
      const tierLevels: { [key: string]: number } = {
        'REGULAR': 0,
        'BRONZE': 1,
        'SILVER': 2,
        'GOLD': 3,
        'PLATINUM': 4
      }
      return tierLevels[tier] || 0
    }

    // Transform regular rewards data
    const transformedRewards = rewards.map(reward => {
      const customerReward = reward.customers[0] // Customer's instance of this reward
      
      // Check if customer can afford this reward
      const canAfford = customer.points >= (reward.pointsCost || 0)
      
      // Check tier requirement - comparing enum values directly
      const meetsRequirement = !reward.minTier || 
        (customer.tier?.level || 0) >= getTierNumericValue(reward.minTier)
      
      // Check usage limit
      const withinUsageLimit = !reward.maxPerCustomer || 
        reward.customers.length < reward.maxPerCustomer
      
      const isAvailable = canAfford && meetsRequirement && withinUsageLimit

      return {
        id: reward.id,
        name: reward.name,
        description: reward.description,
        type: reward.type,
        category: reward.category,
        pointsCost: reward.pointsCost || 0,
        value: parseFloat(reward.value || '0'),
        isAvailable,
        canAfford,
        meetsRequirement,
        withinUsageLimit,
        usageCount: reward.customers.length,
        maxUsage: reward.maxPerCustomer,
        expiresAt: customerReward?.expiresAt?.toISOString(),
        imageUrl: undefined,
        source: 'reward'
      }
    })

    // Transform stamp data to free product rewards
    const freeProductRewards: any[] = []
    
    if (stampData.stamps && Array.isArray(stampData.stamps)) {
      for (const stamp of stampData.stamps) {
        if (stamp.stampsAvailable > 0) {
          // Get campaign details to get product info
          const campaign = await prisma.campaign.findUnique({
            where: { id: stamp.campaignId },
            select: {
              name: true,
              getSpecificProduct: true,
              getFromCategory: true,
              getQuantity: true,
              endDate: true
            }
          })

          if (campaign) {
            // Get product name if getSpecificProduct is a product ID
            let productName = 'Ürün'
            if (campaign.getSpecificProduct) {
              try {
                const product = await prisma.product.findUnique({
                  where: { id: campaign.getSpecificProduct },
                  select: { name: true }
                })
                productName = product?.name || campaign.getSpecificProduct
              } catch (e) {
                productName = campaign.getSpecificProduct
              }
            } else if (campaign.getFromCategory) {
              productName = `${campaign.getFromCategory} ürünü`
            }
            
            const quantity = campaign.getQuantity || 1
            
            // Create separate reward entries for each available free product
            for (let i = 0; i < stamp.stampsAvailable; i++) {
              freeProductRewards.push({
                id: `stamp-${stamp.campaignId}-${i}`,
                name: `${quantity}x ${productName} Bedava`,
                description: `${stamp.campaignName} - ${stamp.buyQuantity} damga tamamlandı`,
                type: 'FREE_PRODUCT',
                category: 'Damga Hediyesi',
                pointsCost: 0,
                value: 0,
                isAvailable: true,
                canAfford: true,
                meetsRequirement: true,
                withinUsageLimit: true,
                usageCount: 0,
                maxUsage: 1,
                expiresAt: campaign.endDate?.toISOString(),
                imageUrl: undefined,
                source: 'stamp',
                campaignId: stamp.campaignId,
                stampsEarned: stamp.stampsEarned,
                stampsAvailable: stamp.stampsAvailable,
                requiredStamps: stamp.buyQuantity
              })
            }
          }
        }
      }
    }

    // Combine all rewards
    const allRewards = [...transformedRewards, ...freeProductRewards]

    // Calculate statistics
    const stats = {
      totalRewards: allRewards.length,
      regularRewards: transformedRewards.length,
      freeProductRights: freeProductRewards.length,
      affordableRewards: allRewards.filter(r => r.canAfford).length,
      customerPoints: customer.points,
      customerTierLevel: customer.tier?.level || 0
    }

    return NextResponse.json({
      rewards: allRewards,
      stats,
      customer: {
        id: customerId,
        points: customer.points,
        tierLevel: customer.tier?.level || 0
      }
    })

  } catch (error) {
    console.error('Error fetching rewards:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Reward redemption endpoint
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'Valid session or Bearer token required' 
      }, { status: 401 })
    }

    const { customerId, rewardId } = await request.json()
    
    if (!customerId || !rewardId) {
      return NextResponse.json({ 
        error: 'Customer ID and Reward ID required' 
      }, { status: 400 })
    }

    // Check if this is a stamp-based free product right
    if (rewardId.startsWith('stamp-')) {
      const [, campaignId, index] = rewardId.split('-')
      
      // Find the campaign and verify customer has enough stamps
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          transactions: {
            where: {
              transaction: {
                customerId: customerId
              }
            }
          }
        }
      })

      if (!campaign) {
        return NextResponse.json({ 
          error: 'Campaign not found' 
        }, { status: 404 })
      }

      const stampsEarned = campaign.transactions.length
      const requiredStamps = campaign.buyQuantity || 5
      const freeProductsAvailable = Math.floor(stampsEarned / requiredStamps)
      
      if (freeProductsAvailable <= parseInt(index)) {
        return NextResponse.json({ 
          error: 'Insufficient stamps for this reward' 
        }, { status: 400 })
      }

      const productName = campaign.getSpecificProduct || `${campaign.getFromCategory} ürünü`
      const quantity = campaign.getQuantity || 1

      return NextResponse.json({
        success: true,
        message: `${quantity}x ${productName} bedava hakkınız kullanım için hazır! Personele gösterin.`,
        type: 'FREE_PRODUCT',
        details: {
          productName,
          quantity,
          campaignName: campaign.name,
          stampsUsed: requiredStamps,
          remainingStamps: stampsEarned - (requiredStamps * (parseInt(index) + 1))
        }
      })
    }

    // Regular reward redemption logic
    const [customer, reward] = await Promise.all([
      prisma.customer.findUnique({
        where: { id: customerId },
        select: { 
          points: true, 
          restaurantId: true,
          tier: { select: { level: true } }
        }
      }),
      prisma.reward.findUnique({
        where: { id: rewardId },
        include: {
          customers: {
            where: { 
              customerId,
              isRedeemed: false 
            }
          }
        }
      })
    ])

    if (!customer || !reward) {
      return NextResponse.json({ 
        error: 'Customer or reward not found' 
      }, { status: 404 })
    }

    // Check if customer can afford this reward
    if (customer.points < (reward.pointsCost || 0)) {
      return NextResponse.json({ 
        error: 'Insufficient points',
        required: reward.pointsCost || 0,
        current: customer.points 
      }, { status: 400 })
    }

    // Check usage limit
    if (reward.maxPerCustomer && reward.customers.length >= reward.maxPerCustomer) {
      return NextResponse.json({ 
        error: 'Usage limit exceeded for this reward' 
      }, { status: 400 })
    }

    // Create customer reward and deduct points
    const pointsToDeduct = reward.pointsCost || 0
    
    await prisma.$transaction([
      // Create customer reward
      prisma.customerReward.create({
        data: {
          customerId,
          rewardId,
          expiresAt: reward.validityDays 
            ? new Date(Date.now() + reward.validityDays * 24 * 60 * 60 * 1000)
            : null
        }
      }),
      // Deduct points from customer
      prisma.customer.update({
        where: { id: customerId },
        data: {
          points: {
            decrement: pointsToDeduct
          }
        }
      }),
      // Create point history record
      prisma.pointHistory.create({
        data: {
          customerId,
          amount: -pointsToDeduct,
          type: 'SPENT',
          source: 'REWARD_REDEMPTION',
          sourceId: rewardId,
          balance: customer.points - pointsToDeduct,
          description: `${reward.name} ödülü için harcanmıştır`
        }
      })
    ])

    return NextResponse.json({
      success: true,
      message: `${reward.name} ödülü başarıyla kullanıldı!`,
      remainingPoints: customer.points - pointsToDeduct,
      type: reward.type,
      details: {
        rewardName: reward.name,
        pointsSpent: pointsToDeduct
      }
    })

  } catch (error) {
    console.error('Error redeeming reward:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}