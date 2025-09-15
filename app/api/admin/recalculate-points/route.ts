import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'Valid session or Bearer token required' 
      }, { status: 401 })
    }

    const body = await request.json()
    const { customerId, all = false } = body

    if (!customerId && !all) {
      return NextResponse.json({ 
        error: 'Either customerId or all flag must be provided' 
      }, { status: 400 })
    }

    let results = []

    if (all) {
      // Recalculate for all customers
      const customers = await prisma.customer.findMany({
        select: { id: true, points: true, name: true, email: true }
      })

      for (const customer of customers) {
        const result = await recalculateCustomerPoints(customer.id)
        results.push({
          customerId: customer.id,
          name: customer.name,
          email: customer.email,
          oldPoints: customer.points,
          newPoints: result.newPoints,
          difference: result.difference,
          status: result.status
        })
      }
    } else {
      // Recalculate for single customer
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { id: true, points: true, name: true, email: true }
      })

      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
      }

      const result = await recalculateCustomerPoints(customerId)
      results.push({
        customerId: customer.id,
        name: customer.name,
        email: customer.email,
        oldPoints: customer.points,
        newPoints: result.newPoints,
        difference: result.difference,
        status: result.status,
        details: result.details
      })
    }

    // Summary statistics
    const summary = {
      totalProcessed: results.length,
      totalCorrected: results.filter(r => r.difference !== 0).length,
      totalPointsAdded: results.reduce((sum, r) => sum + Math.max(0, r.difference), 0),
      totalPointsRemoved: results.reduce((sum, r) => sum + Math.min(0, r.difference), 0)
    }

    return NextResponse.json({
      success: true,
      summary,
      results
    })

  } catch (error) {
    console.error('Error recalculating points:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function recalculateCustomerPoints(customerId: string) {
  try {
    // Get all point history for the customer
    const pointHistory = await prisma.pointHistory.findMany({
      where: { customerId },
      orderBy: { createdAt: 'asc' }
    })

    // Calculate actual balance from history and update running balances
    let runningBalance = 0
    const details = {
      earned: 0,
      spent: 0,
      expired: 0,
      adjusted: 0,
      transactions: pointHistory.length
    }

    // Track which records need balance updates
    const balanceUpdates: { id: string, newBalance: number }[] = []

    for (const entry of pointHistory) {
      switch (entry.type) {
        case 'EARNED':
          runningBalance += entry.amount
          details.earned += entry.amount
          break
        case 'SPENT':
          runningBalance += entry.amount // amount is already negative for SPENT
          details.spent += Math.abs(entry.amount)
          break
        case 'EXPIRED':
          runningBalance += entry.amount // amount is already negative for EXPIRED
          details.expired += Math.abs(entry.amount)
          break
        case 'ADJUSTED':
          runningBalance += entry.amount
          details.adjusted += entry.amount
          break
      }

      // Ensure running balance doesn't go negative
      runningBalance = Math.max(0, runningBalance)

      // Check if the stored balance is different from calculated
      if (entry.balance !== runningBalance) {
        balanceUpdates.push({
          id: entry.id,
          newBalance: runningBalance
        })
      }
    }

    // Update all incorrect running balances
    for (const update of balanceUpdates) {
      await prisma.pointHistory.update({
        where: { id: update.id },
        data: { balance: update.newBalance }
      })
    }

    // Final calculated points
    const calculatedPoints = runningBalance

    // Get current points
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { points: true }
    })

    const currentPoints = customer?.points || 0
    const difference = calculatedPoints - currentPoints

    // Update customer points if there's a difference
    if (difference !== 0) {
      await prisma.customer.update({
        where: { id: customerId },
        data: { points: calculatedPoints }
      })
    }

    return {
      newPoints: calculatedPoints,
      difference,
      status: difference === 0 ? 'UNCHANGED' : difference > 0 ? 'INCREASED' : 'DECREASED',
      details: {
        ...details,
        balanceCorrected: balanceUpdates.length
      }
    }

  } catch (error) {
    console.error(`Error recalculating points for customer ${customerId}:`, error)
    throw error
  }
}