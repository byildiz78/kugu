import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current date info
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

    // Fetch all statistics in parallel
    const [
      totalCustomers,
      customersThisMonth,
      customersLastMonth,
      totalCampaigns,
      activeCampaigns,
      campaignsEndingToday,
      totalSegments,
      segmentsThisMonth,
      recentTransactions,
      totalTransactions,
      transactionsThisMonth,
      transactionsLastMonth,
      todayRevenue,
      thisMonthRevenue,
      lastMonthRevenue,
      revenueByDay,
      pointsByMonthPlaceholder, // placeholder for pointsByMonth
      // Additional transaction stats
      completedTransactions,
      pendingTransactions,
      todayTransactions,
      totalTransactionRevenue,
      // Point transaction stats
      totalPointsEarned,
      totalPointsSpent,
      totalPointsExpired,
      // Today's point stats
      todayPointsEarned,
      todayPointsSpent
    ] = await Promise.all([
      // Total customers
      prisma.customer.count(),
      
      // Customers this month
      prisma.customer.count({
        where: {
          createdAt: {
            gte: startOfMonth
          }
        }
      }),
      
      // Customers last month
      prisma.customer.count({
        where: {
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      }),
      
      // Total campaigns
      prisma.campaign.count(),
      
      // Active campaigns
      prisma.campaign.count({
        where: {
          isActive: true,
          endDate: { gte: now }
        }
      }),
      
      // Campaigns ending today
      prisma.campaign.count({
        where: {
          isActive: true,
          endDate: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            lte: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          }
        }
      }),
      
      // Total segments
      prisma.segment.count(),
      
      // Segments created this month
      prisma.segment.count({
        where: {
          createdAt: {
            gte: startOfMonth
          }
        }
      }),
      
      // Recent transactions for activity feed
      prisma.transaction.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { name: true }
          }
        }
      }),
      
      // Total transactions
      prisma.transaction.count(),
      
      // Transactions this month
      prisma.transaction.count({
        where: {
          createdAt: {
            gte: startOfMonth
          }
        }
      }),
      
      // Transactions last month
      prisma.transaction.count({
        where: {
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      }),

      // Today's revenue
      prisma.transaction.aggregate({
        where: {
          transactionDate: {
            gte: startOfToday,
            lt: endOfToday
          },
          status: 'COMPLETED'
        },
        _sum: {
          finalAmount: true
        }
      }),

      // This month's revenue
      prisma.transaction.aggregate({
        where: {
          transactionDate: {
            gte: startOfMonth
          },
          status: 'COMPLETED'
        },
        _sum: {
          finalAmount: true
        }
      }),

      // Last month's revenue
      prisma.transaction.aggregate({
        where: {
          transactionDate: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          },
          status: 'COMPLETED'
        },
        _sum: {
          finalAmount: true
        }
      }),

      // Revenue by day (last 7 days)
      prisma.transaction.groupBy({
        by: ['transactionDate'],
        where: {
          transactionDate: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          },
          status: 'COMPLETED'
        },
        _sum: {
          finalAmount: true
        },
        _count: {
          id: true
        },
        orderBy: {
          transactionDate: 'asc'
        }
      }),

      // Points by month (last 6 months) - we'll calculate this separately after the main query
      null, // placeholder for pointsByMonth

      // Additional transaction stats
      // Completed transactions
      prisma.transaction.count({
        where: {
          status: 'COMPLETED'
        }
      }),

      // Pending transactions
      prisma.transaction.count({
        where: {
          status: 'PENDING'
        }
      }),

      // Today's transaction count
      prisma.transaction.count({
        where: {
          transactionDate: {
            gte: startOfToday,
            lt: endOfToday
          }
        }
      }),

      // Total transaction revenue (for average calculation)
      prisma.transaction.aggregate({
        where: {
          status: 'COMPLETED'
        },
        _sum: {
          finalAmount: true
        }
      }),

      // Point transaction stats
      // Total points earned
      prisma.pointHistory.aggregate({
        where: {
          type: 'EARNED'
        },
        _sum: {
          amount: true
        }
      }),

      // Total points spent
      prisma.pointHistory.aggregate({
        where: {
          type: 'SPENT'
        },
        _sum: {
          amount: true
        }
      }),

      // Total points expired
      prisma.pointHistory.aggregate({
        where: {
          type: 'EXPIRED'
        },
        _sum: {
          amount: true
        }
      }),

      // Today's points earned
      prisma.pointHistory.aggregate({
        where: {
          type: 'EARNED',
          createdAt: {
            gte: startOfToday,
            lt: endOfToday
          }
        },
        _sum: {
          amount: true
        }
      }),

      // Today's points spent
      prisma.pointHistory.aggregate({
        where: {
          type: 'SPENT',
          createdAt: {
            gte: startOfToday,
            lt: endOfToday
          }
        },
        _sum: {
          amount: true
        }
      })
    ])

    // Calculate growth percentages
    const customerGrowth = customersLastMonth > 0 
      ? Math.round(((customersThisMonth - customersLastMonth) / customersLastMonth) * 100)
      : customersThisMonth > 0 ? 100 : 0

    const transactionGrowth = transactionsLastMonth > 0
      ? Math.round(((transactionsThisMonth - transactionsLastMonth) / transactionsLastMonth) * 100)
      : transactionsThisMonth > 0 ? 100 : 0

    const revenueGrowth = (lastMonthRevenue._sum.finalAmount || 0) > 0
      ? Math.round((((thisMonthRevenue._sum.finalAmount || 0) - (lastMonthRevenue._sum.finalAmount || 0)) / (lastMonthRevenue._sum.finalAmount || 0)) * 100)
      : (thisMonthRevenue._sum.finalAmount || 0) > 0 ? 100 : 0

    // Calculate average order value
    const averageOrderValue = completedTransactions > 0 
      ? (totalTransactionRevenue._sum.finalAmount || 0) / completedTransactions
      : 0

    // Calculate net point balance
    const netPointBalance = (totalPointsEarned._sum.amount || 0) + 
                           (totalPointsSpent._sum.amount || 0) + 
                           (totalPointsExpired._sum.amount || 0)

    // Calculate points by month for the last 6 months
    const pointsByMonth = await Promise.all(
      Array.from({ length: 6 }, async (_, i) => {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
        
        const [earnedData, spentData] = await Promise.all([
          prisma.pointHistory.aggregate({
            where: {
              type: 'EARNED',
              createdAt: {
                gte: monthStart,
                lte: monthEnd
              }
            },
            _sum: { amount: true }
          }),
          prisma.pointHistory.aggregate({
            where: {
              type: 'SPENT',
              createdAt: {
                gte: monthStart,
                lte: monthEnd
              }
            },
            _sum: { amount: true }
          })
        ])
        
        const earned = earnedData._sum.amount || 0
        const spent = Math.abs(spentData._sum.amount || 0)
        
        return {
          month: monthStart.toLocaleDateString('tr-TR', { 
            year: 'numeric', 
            month: 'short' 
          }),
          earned,
          spent,
          earnedTL: earned * 0.1,
          spentTL: spent * 0.1
        }
      })
    )
    
    // Reverse to show oldest to newest
    pointsByMonth.reverse()

    return NextResponse.json({
      stats: {
        totalCustomers,
        customersThisMonth,
        customerGrowth,
        totalCampaigns,
        activeCampaigns,
        campaignsEndingToday,
        totalSegments,
        segmentsThisMonth,
        totalTransactions,
        transactionsThisMonth,
        transactionGrowth,
        todayRevenue: todayRevenue._sum.finalAmount || 0,
        thisMonthRevenue: thisMonthRevenue._sum.finalAmount || 0,
        revenueGrowth,
        // Additional transaction stats
        completedTransactions,
        pendingTransactions,
        averageOrderValue,
        todayTransactions,
        // Point transaction stats
        totalPointsEarned: totalPointsEarned._sum.amount || 0,
        totalPointsSpent: totalPointsSpent._sum.amount || 0,
        totalPointsExpired: totalPointsExpired._sum.amount || 0,
        netPointBalance,
        // Today's point stats
        todayPointsEarned: todayPointsEarned._sum.amount || 0,
        todayPointsSpent: Math.abs(todayPointsSpent._sum.amount || 0)
      },
      recentActivity: recentTransactions.map(transaction => ({
        id: transaction.id,
        type: 'transaction',
        title: 'Yeni işlem',
        description: `${transaction.customer.name} - ${transaction.totalAmount.toLocaleString()} TL`,
        time: transaction.createdAt,
        color: 'bg-green-500'
      })),
      salesData: {
        revenueByDay: revenueByDay.map(day => ({
          date: day.transactionDate,
          revenue: day._sum.finalAmount || 0,
          orderCount: day._count.id || 0
        })),
        pointsByMonth
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}