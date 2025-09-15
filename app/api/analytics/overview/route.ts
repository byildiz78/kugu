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
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } : {}

    // Parallel queries for better performance
    const [
      totalCustomers,
      activeCustomers,
      pointsData,
      transactionsData,
      campaignsData
    ] = await Promise.all([
      // Total customers
      prisma.customer.count({
        where: { restaurantId }
      }),

      // Active customers (had activity in last 30 days)
      prisma.customer.count({
        where: {
          restaurantId,
          lastVisit: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),

      // Points data
      prisma.pointHistory.aggregate({
        where: {
          customer: { restaurantId },
          ...dateFilter
        },
        _sum: {
          amount: true
        }
      }),

      // Transaction data for lifetime value
      prisma.customer.aggregate({
        where: { restaurantId },
        _avg: {
          totalSpent: true
        }
      }),

      // Campaign data for ROI
      prisma.campaign.findMany({
        where: {
          restaurantId,
          isActive: true
        },
        include: {
          usages: {
            include: {
              customer: true
            }
          }
        }
      })
    ])

    // Calculate points statistics
    const totalPointsIssued = await prisma.pointHistory.aggregate({
      where: {
        customer: { restaurantId },
        type: 'EARNED',
        ...dateFilter
      },
      _sum: { amount: true }
    })

    const totalPointsRedeemed = await prisma.pointHistory.aggregate({
      where: {
        customer: { restaurantId },
        type: 'SPENT',
        ...dateFilter
      },
      _sum: { amount: true }
    })

    const pointsIssued = totalPointsIssued._sum.amount || 0
    const pointsRedeemed = Math.abs(totalPointsRedeemed._sum.amount || 0)
    const pointBurnRate = pointsIssued > 0 ? (pointsRedeemed / pointsIssued) * 100 : 0

    // Calculate retention rate (customers who made repeat purchases)
    const repeatCustomers = await prisma.customer.count({
      where: {
        restaurantId,
        visitCount: { gt: 1 }
      }
    })

    const customerRetentionRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0

    // Calculate campaign ROI
    let campaignROI = 0
    if (campaignsData.length > 0) {
      const totalCampaignRevenue = campaignsData.reduce((sum, campaign) => {
        return sum + campaign.usages.reduce((usageSum, usage) => usageSum + usage.orderAmount, 0)
      }, 0)

      const totalCampaignDiscount = campaignsData.reduce((sum, campaign) => {
        return sum + campaign.usages.reduce((usageSum, usage) => usageSum + usage.discountAmount, 0)
      }, 0)

      campaignROI = totalCampaignDiscount > 0 ? totalCampaignRevenue / totalCampaignDiscount : 0
    }

    const overview = {
      totalCustomers,
      activeCustomers,
      customerRetentionRate: Math.round(customerRetentionRate * 10) / 10,
      averageLifetimeValue: Math.round((transactionsData._avg.totalSpent || 0) * 100) / 100,
      totalPointsIssued: pointsIssued,
      totalPointsRedeemed: pointsRedeemed,
      pointBurnRate: Math.round(pointBurnRate * 10) / 10,
      campaignROI: Math.round(campaignROI * 10) / 10
    }

    return NextResponse.json(overview)
  } catch (error) {
    console.error('Error fetching analytics overview:', error)
    return NextResponse.json(
      { error: 'Analytics overview verisi alınırken hata oluştu' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}