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

    // Get segments with detailed customer and transaction data
    const segments = await prisma.segment.findMany({
      where: { restaurantId },
      include: {
        customers: {
          include: {
            customer: {
              include: {
                transactions: {
                  where: transactionDateFilter,
                  include: {
                    items: true,
                    appliedCampaigns: true
                  }
                },
                pointHistory: {
                  where: startDate && endDate ? {
                    createdAt: {
                      gte: new Date(startDate),
                      lte: new Date(endDate)
                    }
                  } : {}
                }
              }
            }
          }
        }
      }
    })

    // Calculate analytics for each segment
    const segmentsWithAnalytics = await Promise.all(segments.map(async (segment) => {
      const customers = segment.customers.map(cs => cs.customer)
      const customerCount = customers.length

      if (customerCount === 0) {
        return {
          id: segment.id,
          name: segment.name,
          description: segment.description || 'Segment açıklaması yok',
          customerCount: 0,
          activeCustomers: 0,
          totalRevenue: 0,
          averageSpending: 0,
          pointsEarned: 0,
          pointsRedeemed: 0,
          engagementRate: 0,
          retentionRate: 0,
          growthRate: 0,
          campaignParticipation: 0,
          topProducts: [],
          riskScore: 'LOW' as const,
          color: '#6B7280'
        }
      }

      // Active customers (had activity in last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const activeCustomers = customers.filter(c => 
        c.lastVisit && c.lastVisit >= thirtyDaysAgo
      ).length

      // Calculate total revenue from transactions
      const allTransactions = customers.flatMap(c => c.transactions)
      const totalRevenue = allTransactions.reduce((sum, t) => sum + t.finalAmount, 0)
      const averageSpending = customerCount > 0 ? totalRevenue / customerCount : 0

      // Calculate points
      const allPointHistory = customers.flatMap(c => c.pointHistory)
      const pointsEarned = allPointHistory
        .filter(ph => ph.type === 'EARNED')
        .reduce((sum, ph) => sum + ph.amount, 0)
      const pointsRedeemed = Math.abs(allPointHistory
        .filter(ph => ph.type === 'SPENT')
        .reduce((sum, ph) => sum + ph.amount, 0))

      // Engagement rate (customers with transactions vs total customers)
      const customersWithTransactions = customers.filter(c => c.transactions.length > 0).length
      const engagementRate = customerCount > 0 ? (customersWithTransactions / customerCount) * 100 : 0

      // Retention rate (customers with more than one visit)
      const repeatCustomers = customers.filter(c => c.visitCount > 1).length
      const retentionRate = customerCount > 0 ? (repeatCustomers / customerCount) * 100 : 0

      // Campaign participation (customers who used campaigns)
      const customersWithCampaigns = customers.filter(c => 
        c.transactions.some(t => t.appliedCampaigns.length > 0)
      ).length
      const campaignParticipation = customerCount > 0 ? (customersWithCampaigns / customerCount) * 100 : 0

      // Top products in this segment
      const productCounts = new Map<string, number>()
      allTransactions.forEach(transaction => {
        transaction.items.forEach(item => {
          const current = productCounts.get(item.productName) || 0
          productCounts.set(item.productName, current + item.quantity)
        })
      })

      const topProducts = Array.from(productCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([product]) => product)

      // Calculate growth rate (last 30 days vs previous 30 days)
      const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const previous60Days = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)

      const recentTransactions = allTransactions.filter(t => t.transactionDate >= last30Days)
      const previousTransactions = allTransactions.filter(t => 
        t.transactionDate >= previous60Days && t.transactionDate < last30Days
      )

      const recentRevenue = recentTransactions.reduce((sum, t) => sum + t.finalAmount, 0)
      const previousRevenue = previousTransactions.reduce((sum, t) => sum + t.finalAmount, 0)

      const growthRate = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0

      // Risk score calculation
      let riskScore: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'
      
      if (engagementRate < 30 || retentionRate < 40 || growthRate < -20) {
        riskScore = 'HIGH'
      } else if (engagementRate < 60 || retentionRate < 70 || growthRate < 0) {
        riskScore = 'MEDIUM'
      }

      // Color assignment based on performance
      let color = '#6B7280'
      if (averageSpending > 200 && retentionRate > 80) color = '#FFD700' // Gold
      else if (averageSpending > 100 && retentionRate > 60) color = '#4F46E5' // Indigo
      else if (averageSpending > 50 && retentionRate > 40) color = '#10B981' // Green
      else if (riskScore === 'MEDIUM') color = '#F59E0B' // Yellow
      else if (riskScore === 'HIGH') color = '#EF4444' // Red

      return {
        id: segment.id,
        name: segment.name,
        description: segment.description || 'Segment açıklaması yok',
        customerCount,
        activeCustomers,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        averageSpending: Math.round(averageSpending * 100) / 100,
        pointsEarned,
        pointsRedeemed,
        engagementRate: Math.round(engagementRate * 10) / 10,
        retentionRate: Math.round(retentionRate * 10) / 10,
        growthRate: Math.round(growthRate * 10) / 10,
        campaignParticipation: Math.round(campaignParticipation * 10) / 10,
        topProducts,
        riskScore,
        color
      }
    }))

    // Calculate overview statistics
    const totalSegments = segmentsWithAnalytics.length
    
    const mostActiveSegment = segmentsWithAnalytics.reduce((max, segment) => 
      segment.engagementRate > max.engagementRate ? segment : max,
      segmentsWithAnalytics[0] || { engagementRate: 0, name: 'Yok' }
    ).name

    const highestValueSegment = segmentsWithAnalytics.reduce((max, segment) => 
      segment.totalRevenue > max.totalRevenue ? segment : max,
      segmentsWithAnalytics[0] || { totalRevenue: 0, name: 'Yok' }
    ).name

    const fastestGrowingSegment = segmentsWithAnalytics.reduce((max, segment) => 
      segment.growthRate > max.growthRate ? segment : max,
      segmentsWithAnalytics[0] || { growthRate: 0, name: 'Yok' }
    ).name

    // Segment migration analysis (simplified - would need historical data for accurate migration)
    const segmentMigration = [
      {
        from: 'Yeni Müşteriler',
        to: 'Sadık Müşteriler',
        count: Math.floor(Math.random() * 20) + 5 // Placeholder
      },
      {
        from: 'Sadık Müşteriler',
        to: 'Premium Müşteriler',
        count: Math.floor(Math.random() * 15) + 3 // Placeholder
      }
    ]

    const segmentPerformanceData = {
      segments: segmentsWithAnalytics.sort((a, b) => b.totalRevenue - a.totalRevenue),
      overview: {
        totalSegments,
        mostActiveSegment,
        highestValueSegment,
        fastestGrowingSegment
      },
      segmentMigration
    }

    return NextResponse.json(segmentPerformanceData)
  } catch (error) {
    console.error('Error fetching segment performance:', error)
    return NextResponse.json(
      { error: 'Segment performance verisi alınırken hata oluştu' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}