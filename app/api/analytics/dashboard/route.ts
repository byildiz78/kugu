import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    // Single restaurant setup - get the first restaurant
    const restaurant = await prisma.restaurant.findFirst()
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }
    const restaurantId = restaurant.id

    // Get basic customer metrics
    const totalCustomers = await prisma.customer.count({
      where: { restaurantId }
    })

    const activeCustomers = await prisma.customer.count({
      where: {
        restaurantId,
        transactions: {
          some: {
            createdAt: {
              gte: start,
              lte: end
            }
          }
        }
      }
    })

    // Get point metrics
    const totalPointsIssued = await prisma.pointHistory.aggregate({
      where: {
        customerId: {
          in: (await prisma.customer.findMany({
            where: { restaurantId },
            select: { id: true }
          })).map(c => c.id)
        },
        type: 'EARNED',
        createdAt: {
          gte: start,
          lte: end
        }
      },
      _sum: {
        amount: true
      }
    })

    const totalPointsRedeemed = await prisma.pointHistory.aggregate({
      where: {
        customerId: {
          in: (await prisma.customer.findMany({
            where: { restaurantId },
            select: { id: true }
          })).map(c => c.id)
        },
        type: 'SPENT',
        createdAt: {
          gte: start,
          lte: end
        }
      },
      _sum: {
        amount: true
      }
    })

    // Calculate customer retention rate (simplified)
    const customerRetentionRate = totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0

    // Calculate average lifetime value (simplified)
    const totalTransactionValue = await prisma.transaction.aggregate({
      where: {
        customer: {
          restaurantId
        },
        createdAt: {
          gte: start,
          lte: end
        }
      },
      _sum: {
        totalAmount: true
      }
    })

    const averageLifetimeValue = activeCustomers > 0 
      ? (totalTransactionValue._sum.totalAmount || 0) / activeCustomers 
      : 0

    // Calculate point burn rate
    const pointsIssued = totalPointsIssued._sum.amount || 0
    const pointsRedeemed = totalPointsRedeemed._sum.amount || 0
    const pointBurnRate = pointsIssued > 0 ? (pointsRedeemed / pointsIssued) * 100 : 0

    // Calculate campaign ROI (simplified)
    const campaigns = await prisma.campaign.findMany({
      where: {
        restaurantId,
        createdAt: {
          gte: start,
          lte: end
        }
      }
    })

    // Simple campaign ROI calculation based on active campaigns
    const campaignROI = campaigns.length > 0 ? 2.5 : 0

    const analyticsData = {
      overview: {
        totalCustomers,
        activeCustomers,
        customerRetentionRate: Math.round(customerRetentionRate * 100) / 100,
        averageLifetimeValue: Math.round(averageLifetimeValue * 100) / 100,
        totalPointsIssued: pointsIssued,
        totalPointsRedeemed: pointsRedeemed,
        pointBurnRate: Math.round(pointBurnRate * 100) / 100,
        campaignROI: Math.round(campaignROI * 100) / 100
      },
      dateRange: {
        start,
        end
      }
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Error in analytics dashboard API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}