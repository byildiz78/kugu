import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Single restaurant setup - get the first restaurant
    const restaurant = await prisma.restaurant.findFirst()
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }
    
    const restaurantId = restaurant.id
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Date filters
    const dateFilter = startDate && endDate ? {
      OR: [
        {
          startDate: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        },
        {
          endDate: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        },
        {
          AND: [
            { startDate: { lte: new Date(startDate) } },
            { endDate: { gte: new Date(endDate) } }
          ]
        }
      ]
    } : {}

    // Get campaigns with their usage data
    const campaignsData = await prisma.campaign.findMany({
      where: {
        restaurantId,
        ...dateFilter
      },
      include: {
        usages: {
          where: startDate && endDate ? {
            usedAt: {
              gte: new Date(startDate),
              lte: new Date(endDate)
            }
          } : {},
          include: {
            customer: true
          }
        },
        transactions: {
          where: startDate && endDate ? {
            transaction: {
              transactionDate: {
                gte: new Date(startDate),
                lte: new Date(endDate)
              }
            }
          } : {},
          include: {
            transaction: true
          }
        }
      }
    })

    // Calculate campaign statistics
    const campaigns = await Promise.all(campaignsData.map(async (campaign) => {
      const usages = campaign.usages
      const transactions = campaign.transactions
      
      const participantCount = new Set(usages.map(u => u.customerId)).size
      const totalSpent = usages.reduce((sum, usage) => sum + usage.orderAmount, 0)
      const totalDiscount = usages.reduce((sum, usage) => sum + usage.discountAmount, 0)
      
      // Calculate points distributed from transactions
      const pointsDistributed = transactions.reduce((sum, tx) => sum + tx.pointsEarned, 0)
      
      // Calculate conversion rate (unique customers who used vs total customers in restaurant)
      const totalCustomers = await prisma.customer.count({
        where: { restaurantId }
      })
      const conversionRate = totalCustomers > 0 ? (participantCount / totalCustomers) * 100 : 0
      
      // Calculate ROI
      const roi = totalDiscount > 0 ? totalSpent / totalDiscount : 0
      
      // Calculate average order value
      const averageOrderValue = usages.length > 0 ? totalSpent / usages.length : 0
      
      // Calculate repeat purchase rate (customers who used the campaign more than once)
      const customerUsageCount = usages.reduce((acc, usage) => {
        acc[usage.customerId] = (acc[usage.customerId] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const repeatCustomers = Object.values(customerUsageCount).filter(count => count > 1).length
      const repeatPurchaseRate = participantCount > 0 ? (repeatCustomers / participantCount) * 100 : 0
      
      // Calculate engagement rate (usage count vs max possible usage)
      const maxPossibleUsage = campaign.maxUsage || usages.length
      const engagement = maxPossibleUsage > 0 ? (usages.length / maxPossibleUsage) * 100 : 100
      
      // Determine status
      const now = new Date()
      let status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'DRAFT'
      
      if (!campaign.isActive) {
        status = 'PAUSED'
      } else if (now > campaign.endDate) {
        status = 'COMPLETED'
      } else if (now >= campaign.startDate && now <= campaign.endDate) {
        status = 'ACTIVE'
      } else {
        status = 'DRAFT'
      }

      return {
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        status,
        startDate: campaign.startDate.toISOString(),
        endDate: campaign.endDate.toISOString(),
        participantCount,
        totalSpent: Math.round(totalSpent * 100) / 100,
        pointsDistributed,
        conversionRate: Math.round(conversionRate * 10) / 10,
        roi: Math.round(roi * 10) / 10,
        engagement: Math.round(Math.min(engagement, 100) * 10) / 10,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        repeatPurchaseRate: Math.round(repeatPurchaseRate * 10) / 10
      }
    }))

    // Calculate overview statistics
    const totalCampaigns = campaignsData.length
    const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length
    const averageROI = campaigns.length > 0 
      ? campaigns.reduce((sum, c) => sum + c.roi, 0) / campaigns.length 
      : 0
    const totalParticipants = campaigns.reduce((sum, c) => sum + c.participantCount, 0)
    const totalSpent = campaigns.reduce((sum, c) => sum + c.totalSpent, 0)

    const campaignData = {
      campaigns,
      overview: {
        totalCampaigns,
        activeCampaigns,
        averageROI: Math.round(averageROI * 10) / 10,
        totalParticipants,
        totalSpent: Math.round(totalSpent * 100) / 100
      }
    }

    return NextResponse.json(campaignData)
  } catch (error) {
    console.error('Error fetching campaign performance:', error)
    return NextResponse.json(
      { error: 'Campaign performance verisi alınırken hata oluştu' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}