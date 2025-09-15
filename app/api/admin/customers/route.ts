import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        // isActive field doesn't exist in schema, removing this filter
      },
      select: {
        id: true,
        name: true,
        phone: true,
        points: true,
        level: true,
        createdAt: true,
        tier: {
          select: {
            name: true
          }
        },
        segments: {
          select: {
            segment: {
              select: {
                name: true
              }
            }
          }
        },
        pushSubscriptions: {
          where: {
            isActive: true
          },
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Return all customers from database (don't filter by push subscription)
    const allCustomers = customers.map(customer => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      loyaltyTier: customer.tier?.name || customer.level || 'Bronze',
      segment: customer.segments.length > 0 ? customer.segments[0].segment.name : 'Regular',
      totalPoints: customer.points,
      hasSubscription: customer.pushSubscriptions.length > 0, // Keep track but don't filter
      createdAt: customer.createdAt
    }))

    return NextResponse.json(allCustomers)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'Müşteriler alınamadı' }, { status: 500 })
  }
}