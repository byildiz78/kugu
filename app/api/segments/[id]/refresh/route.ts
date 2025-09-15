import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  SegmentCriteria, 
  calculateCustomerAnalytics, 
  filterTransactionsByPeriod, 
  matchesSegmentCriteria 
} from '@/lib/segment-analyzer'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get segment with criteria
    const segment = await prisma.segment.findUnique({
      where: { id: params.id },
      include: {
        customers: true
      }
    })

    if (!segment) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 })
    }

    if (!segment.isAutomatic || !segment.criteria) {
      return NextResponse.json({ error: 'Segment is not automatic' }, { status: 400 })
    }

    const criteria: SegmentCriteria = JSON.parse(segment.criteria)

    // Get all customers with their transactions
    const customers = await prisma.customer.findMany({
      where: {
        restaurantId: segment.restaurantId
      },
      include: {
        transactions: {
          select: {
            totalAmount: true,
            transactionDate: true
          }
        }
      }
    })

    // Clear existing segment relationships
    await prisma.customerSegment.deleteMany({
      where: { segmentId: segment.id }
    })

    // Analyze each customer and add to segment if matches criteria
    const matchingCustomers: string[] = []

    for (const customer of customers) {
      // Filter transactions by period
      const filteredTransactions = filterTransactionsByPeriod(
        customer.transactions.map(t => ({
          amount: Number(t.totalAmount),
          transactionDate: t.transactionDate
        })),
        criteria.period
      )

      // Calculate analytics
      const analytics = calculateCustomerAnalytics(
        filteredTransactions,
        customer.createdAt
      )

      // Check if customer matches criteria
      if (matchesSegmentCriteria(analytics, criteria)) {
        matchingCustomers.push(customer.id)
      }
    }

    // Add matching customers to segment
    if (matchingCustomers.length > 0) {
      await prisma.customerSegment.createMany({
        data: matchingCustomers.map(customerId => ({
          customerId,
          segmentId: segment.id
        }))
      })
    }

    return NextResponse.json({
      message: `Segment yenilendi: ${matchingCustomers.length} müşteri eklendi`,
      customersAdded: matchingCustomers.length,
      totalCustomers: customers.length
    })
  } catch (error) {
    console.error('Error refreshing segment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}