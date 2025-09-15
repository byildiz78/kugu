import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') // EARNED, SPENT, EXPIRED

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 })
    }

    const skip = (page - 1) * limit

    const where: any = {
      customerId
    }

    if (type) {
      where.type = type
    }

    const [pointHistory, total] = await Promise.all([
      prisma.pointHistory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { name: true }
          }
        }
      }),
      prisma.pointHistory.count({ where })
    ])

    return NextResponse.json({
      pointHistory,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching point history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'Valid session or Bearer token required' 
      }, { status: 401 })
    }

    // Only admins and restaurant staff can manually add point history (skip role check for API token)
    if (auth.session && !['ADMIN', 'RESTAURANT_ADMIN', 'STAFF'].includes(auth.session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { customerId, amount, type, source, description, expiresAt } = body

    if (!customerId || !amount || !type || !source) {
      return NextResponse.json({ 
        error: 'CustomerId, amount, type, and source are required' 
      }, { status: 400 })
    }

    // Get current customer points to calculate balance
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Calculate new balance
    const newBalance = customer.points + amount

    const pointHistoryEntry = await prisma.pointHistory.create({
      data: {
        customerId,
        amount,
        type,
        source,
        description,
        balance: newBalance,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      },
      include: {
        customer: {
          select: { name: true }
        }
      }
    })

    // Update customer points
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        points: newBalance
      }
    })

    return NextResponse.json(pointHistoryEntry, { status: 201 })
  } catch (error) {
    console.error('Error creating point history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}