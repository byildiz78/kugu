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

    // Date filters for transactions
    const transactionDateFilter = startDate && endDate ? {
      transactionDate: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } : {}

    // Get customers with their aggregated data
    const customersWithStats = await prisma.customer.findMany({
      where: { 
        restaurantId,
        // Only include customers who have transactions in the date range (if specified)
        ...(startDate && endDate ? {
          transactions: {
            some: transactionDateFilter
          }
        } : {})
      },
      include: {
        tier: true,
        transactions: {
          where: transactionDateFilter,
          select: {
            finalAmount: true,
            pointsEarned: true,
            pointsUsed: true,
            transactionDate: true
          }
        },
        pointHistory: {
          where: {
            ...(startDate && endDate ? {
              createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate)
              }
            } : {})
          },
          select: {
            amount: true,
            type: true
          }
        }
      }
    })

    // Calculate stats for each customer
    const customersWithCalculatedStats = customersWithStats.map(customer => {
      const totalSpent = customer.transactions.reduce((sum, tx) => sum + tx.finalAmount, 0)
      const totalTransactions = customer.transactions.length
      const pointsEarned = customer.pointHistory
        .filter(ph => ph.type === 'EARNED')
        .reduce((sum, ph) => sum + ph.amount, 0)
      const pointsUsed = Math.abs(customer.pointHistory
        .filter(ph => ph.type === 'SPENT')
        .reduce((sum, ph) => sum + ph.amount, 0))

      // Calculate growth rate (last 30 days vs previous 30 days)
      const now = new Date()
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const previous30Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

      const recentSpent = customer.transactions
        .filter(tx => tx.transactionDate >= last30Days)
        .reduce((sum, tx) => sum + tx.finalAmount, 0)

      const previousSpent = customer.transactions
        .filter(tx => tx.transactionDate >= previous30Days && tx.transactionDate < last30Days)
        .reduce((sum, tx) => sum + tx.finalAmount, 0)

      const growthRate = previousSpent > 0 ? ((recentSpent - previousSpent) / previousSpent) * 100 : 0

      const lastTransaction = customer.transactions.length > 0 
        ? customer.transactions.reduce((latest, tx) => 
            tx.transactionDate > latest.transactionDate ? tx : latest
          ).transactionDate 
        : customer.lastVisit

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        totalSpent,
        totalTransactions,
        pointsUsed,
        pointsEarned,
        tier: customer.tier ? {
          name: customer.tier.name,
          color: customer.tier.color,
          displayName: customer.tier.displayName
        } : null,
        lastPurchase: lastTransaction?.toISOString() || customer.lastVisit?.toISOString() || customer.createdAt.toISOString(),
        growthRate: Math.round(growthRate * 10) / 10
      }
    }).filter(customer => customer.totalSpent > 0) // Only include customers with spending

    // Sort and get top customers by different criteria
    const topBySpending = [...customersWithCalculatedStats]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)

    const topByTransactions = [...customersWithCalculatedStats]
      .sort((a, b) => b.totalTransactions - a.totalTransactions)
      .slice(0, 10)

    const topByPoints = [...customersWithCalculatedStats]
      .sort((a, b) => b.pointsUsed - a.pointsUsed)
      .slice(0, 10)

    const topCustomersData = {
      topBySpending,
      topByTransactions,
      topByPoints
    }

    return NextResponse.json(topCustomersData)
  } catch (error) {
    console.error('Error fetching top customers:', error)
    return NextResponse.json(
      { error: 'Top customers verisi alınırken hata oluştu' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}