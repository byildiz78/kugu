import { prisma } from './prisma'
import { 
  calculateCustomerAnalytics, 
  filterTransactionsByPeriod, 
  matchesSegmentCriteria,
  SegmentCriteria 
} from './segment-analyzer'

/**
 * Automatically assign customer to matching automatic segments
 */
export async function assignCustomerToAutomaticSegments(customerId: string) {
  try {
    // Get customer with transactions
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        transactions: {
          select: {
            totalAmount: true,
            transactionDate: true
          }
        }
      }
    })

    if (!customer) return

    // Get all automatic segments for this restaurant
    const automaticSegments = await prisma.segment.findMany({
      where: {
        restaurantId: customer.restaurantId,
        isAutomatic: true,
        criteria: { not: null }
      }
    })

    // Check each segment
    for (const segment of automaticSegments) {
      if (!segment.criteria) continue

      try {
        const criteria: SegmentCriteria = JSON.parse(segment.criteria)

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
        const matches = matchesSegmentCriteria(analytics, criteria)

        // Check if customer is already in segment
        const existingRelation = await prisma.customerSegment.findUnique({
          where: {
            customerId_segmentId: {
              customerId: customer.id,
              segmentId: segment.id
            }
          }
        })

        if (matches && !existingRelation) {
          // Add customer to segment with upsert to prevent race conditions
          await prisma.customerSegment.upsert({
            where: {
              customerId_segmentId: {
                customerId: customer.id,
                segmentId: segment.id
              }
            },
            create: {
              customerId: customer.id,
              segmentId: segment.id
            },
            update: {} // No update needed
          })
        } else if (!matches && existingRelation) {
          // Remove customer from segment
          await prisma.customerSegment.delete({
            where: {
              customerId_segmentId: {
                customerId: customer.id,
                segmentId: segment.id
              }
            }
          })
        }
      } catch (error) {
        console.error(`Error processing segment ${segment.id}:`, error)
      }
    }
  } catch (error) {
    console.error('Error assigning customer to automatic segments:', error)
  }
}

/**
 * Update all automatic segments for a restaurant
 */
export async function refreshAllAutomaticSegments(restaurantId: string) {
  try {
    const automaticSegments = await prisma.segment.findMany({
      where: {
        restaurantId,
        isAutomatic: true,
        criteria: { not: null }
      }
    })

    const customers = await prisma.customer.findMany({
      where: { restaurantId },
      include: {
        transactions: {
          select: {
            totalAmount: true,
            transactionDate: true
          }
        }
      }
    })

    for (const segment of automaticSegments) {
      if (!segment.criteria) continue

      try {
        const criteria: SegmentCriteria = JSON.parse(segment.criteria)

        // Clear existing relationships
        await prisma.customerSegment.deleteMany({
          where: { segmentId: segment.id }
        })

        const matchingCustomerIds: string[] = []

        for (const customer of customers) {
          const filteredTransactions = filterTransactionsByPeriod(
            customer.transactions.map(t => ({
              amount: Number(t.totalAmount),
              transactionDate: t.transactionDate
            })),
            criteria.period
          )

          const analytics = calculateCustomerAnalytics(
            filteredTransactions,
            customer.createdAt
          )

          if (matchesSegmentCriteria(analytics, criteria)) {
            matchingCustomerIds.push(customer.id)
          }
        }

        // Bulk create relationships
        if (matchingCustomerIds.length > 0) {
          await prisma.customerSegment.createMany({
            data: matchingCustomerIds.map(customerId => ({
              customerId,
              segmentId: segment.id
            }))
          })
        }
      } catch (error) {
        console.error(`Error refreshing segment ${segment.id}:`, error)
      }
    }
  } catch (error) {
    console.error('Error refreshing automatic segments:', error)
  }
}