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
    const transactionDateFilter = startDate && endDate ? {
      transactionDate: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } : {}

    // Get revenue data
    const [revenueStats, previousPeriodStats, loyaltyRevenue, transactions] = await Promise.all([
      // Current period revenue stats
      prisma.transaction.aggregate({
        where: {
          customer: { restaurantId },
          ...transactionDateFilter
        },
        _sum: {
          finalAmount: true,
          totalAmount: true
        },
        _avg: {
          finalAmount: true
        },
        _count: true
      }),

      // Previous period for growth calculation
      prisma.transaction.aggregate({
        where: {
          customer: { restaurantId },
          ...(startDate && endDate ? {
            transactionDate: {
              gte: new Date(new Date(startDate).getTime() - (new Date(endDate).getTime() - new Date(startDate).getTime())),
              lte: new Date(startDate)
            }
          } : {})
        },
        _sum: {
          finalAmount: true
        },
        _avg: {
          finalAmount: true
        }
      }),

      // Revenue from loyalty members (customers with points or tier)
      prisma.transaction.aggregate({
        where: {
          customer: { 
            restaurantId,
            OR: [
              { points: { gt: 0 } },
              { tierId: { not: null } }
            ]
          },
          ...transactionDateFilter
        },
        _sum: {
          finalAmount: true
        }
      }),

      // All transactions for detailed analysis
      prisma.transaction.findMany({
        where: {
          customer: { restaurantId },
          ...transactionDateFilter
        },
        include: {
          customer: {
            include: {
              segments: {
                include: {
                  segment: true
                }
              },
              tier: true
            }
          },
          items: true
        }
      })
    ])

    const totalRevenue = revenueStats._sum.finalAmount || 0
    const averageOrderValue = revenueStats._avg.finalAmount || 0
    const revenueFromLoyaltyMembers = loyaltyRevenue._sum.finalAmount || 0

    // Calculate growth rates
    const previousRevenue = previousPeriodStats._sum.finalAmount || 0
    const previousAOV = previousPeriodStats._avg.finalAmount || 0

    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0
    const averageOrderValueGrowth = previousAOV > 0 ? ((averageOrderValue - previousAOV) / previousAOV) * 100 : 0

    // Calculate loyalty program ROI
    const loyaltyProgramROI = revenueFromLoyaltyMembers > 0 && totalRevenue > 0 
      ? revenueFromLoyaltyMembers / (totalRevenue - revenueFromLoyaltyMembers) 
      : 0

    // Revenue by segments
    const segmentRevenue = new Map<string, { revenue: number, transactions: number }>()
    
    transactions.forEach(transaction => {
      transaction.customer.segments.forEach(customerSegment => {
        const segmentName = customerSegment.segment.name
        const current = segmentRevenue.get(segmentName) || { revenue: 0, transactions: 0 }
        current.revenue += transaction.finalAmount
        current.transactions += 1
        segmentRevenue.set(segmentName, current)
      })
      
      // Handle customers without segments
      if (transaction.customer.segments.length === 0) {
        const current = segmentRevenue.get('Segmentsiz') || { revenue: 0, transactions: 0 }
        current.revenue += transaction.finalAmount
        current.transactions += 1
        segmentRevenue.set('Segmentsiz', current)
      }
    })

    const revenueBySegment = Array.from(segmentRevenue.entries()).map(([segment, data]) => {
      const percentage = totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
      
      // Calculate segment colors based on revenue
      let color = '#6B7280'
      if (data.revenue > totalRevenue * 0.3) color = '#FFD700' // Gold for high revenue
      else if (data.revenue > totalRevenue * 0.2) color = '#4F46E5' // Indigo for medium-high
      else if (data.revenue > totalRevenue * 0.1) color = '#10B981' // Green for medium
      else if (data.revenue > totalRevenue * 0.05) color = '#F59E0B' // Yellow for low-medium
      else color = '#EF4444' // Red for low

      return {
        segment,
        revenue: Math.round(data.revenue * 100) / 100,
        percentage: Math.round(percentage * 10) / 10,
        growth: 0, // Would need historical data for accurate growth
        color
      }
    }).sort((a, b) => b.revenue - a.revenue)

    // Monthly revenue trend (simplified approach)
    const monthlyRevenue = [
      {
        month: new Date().toISOString().substring(0, 7),
        total: Math.round(totalRevenue * 100) / 100,
        loyalty: Math.round(revenueFromLoyaltyMembers * 100) / 100,
        growth: Math.round(revenueGrowth * 10) / 10
      }
    ]

    // Revenue channels (based on payment method)
    const channelStats = transactions.reduce((acc, tx) => {
      let channel = 'Fiziksel Mağaza'
      if (tx.paymentMethod?.includes('card') || tx.paymentMethod?.includes('online')) {
        channel = 'Web Sitesi'
      } else if (tx.paymentMethod?.includes('mobile') || tx.paymentMethod?.includes('app')) {
        channel = 'Mobil Uygulama'
      }
      
      if (!acc[channel]) {
        acc[channel] = { revenue: 0, orders: 0 }
      }
      
      acc[channel].revenue += tx.finalAmount
      acc[channel].orders += 1
      
      return acc
    }, {} as Record<string, { revenue: number, orders: number }>)

    const revenueChannels = Object.entries(channelStats).map(([channel, stats]) => ({
      channel,
      revenue: Math.round(stats.revenue * 100) / 100,
      percentage: totalRevenue > 0 ? Math.round((stats.revenue / totalRevenue) * 1000) / 10 : 0,
      orders: stats.orders,
      averageOrderValue: stats.orders > 0 ? Math.round((stats.revenue / stats.orders) * 100) / 100 : 0
    }))

    // Points impact analysis
    const transactionsWithPoints = transactions.filter(t => t.pointsUsed > 0)
    const transactionsWithoutPoints = transactions.filter(t => t.pointsUsed === 0)

    const averageSpendWhenUsingPoints = transactionsWithPoints.length > 0 
      ? transactionsWithPoints.reduce((sum, t) => sum + t.finalAmount, 0) / transactionsWithPoints.length
      : 0

    const averageSpendWithoutPoints = transactionsWithoutPoints.length > 0 
      ? transactionsWithoutPoints.reduce((sum, t) => sum + t.finalAmount, 0) / transactionsWithoutPoints.length
      : 0

    const revenueFromPointRedemptions = transactionsWithPoints.reduce((sum, t) => sum + t.finalAmount, 0)
    const pointsInfluenceRate = transactions.length > 0 
      ? (transactionsWithPoints.length / transactions.length) * 100 
      : 0

    // Top revenue categories
    const categoryRevenue = new Map<string, number>()
    
    transactions.forEach(transaction => {
      transaction.items.forEach(item => {
        const category = item.category || 'Diğer'
        const current = categoryRevenue.get(category) || 0
        categoryRevenue.set(category, current + item.totalPrice)
      })
    })

    const topRevenueCategories = Array.from(categoryRevenue.entries())
      .map(([category, revenue]) => ({
        category,
        revenue: Math.round(revenue * 100) / 100,
        percentage: totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 1000) / 10 : 0,
        growth: 0 // Would need historical data
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    const revenueAnalyticsData = {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      revenueFromLoyaltyMembers: Math.round(revenueFromLoyaltyMembers * 100) / 100,
      loyaltyProgramROI: Math.round(loyaltyProgramROI * 10) / 10,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      averageOrderValueGrowth: Math.round(averageOrderValueGrowth * 10) / 10,
      revenueBySegment,
      monthlyRevenue,
      revenueChannels,
      pointsImpactOnRevenue: {
        revenueFromPointRedemptions: Math.round(revenueFromPointRedemptions * 100) / 100,
        averageSpendWhenUsingPoints: Math.round(averageSpendWhenUsingPoints * 100) / 100,
        averageSpendWithoutPoints: Math.round(averageSpendWithoutPoints * 100) / 100,
        pointsInfluenceRate: Math.round(pointsInfluenceRate * 10) / 10
      },
      topRevenueCategories
    }

    return NextResponse.json(revenueAnalyticsData)
  } catch (error) {
    console.error('Error fetching revenue analytics:', error)
    
    // Return minimal data if there's an error
    return NextResponse.json({
      totalRevenue: 0,
      revenueGrowth: 0,
      revenueFromLoyaltyMembers: 0,
      loyaltyProgramROI: 0,
      averageOrderValue: 0,
      averageOrderValueGrowth: 0,
      revenueBySegment: [],
      monthlyRevenue: [],
      revenueChannels: [],
      pointsImpactOnRevenue: {
        revenueFromPointRedemptions: 0,
        averageSpendWhenUsingPoints: 0,
        averageSpendWithoutPoints: 0,
        pointsInfluenceRate: 0
      },
      topRevenueCategories: []
    })
  } finally {
    await prisma.$disconnect()
  }
}