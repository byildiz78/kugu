import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get active push subscriptions count
    const activeSubscriptions = await prisma.pushSubscription.count({
      where: {
        isActive: true
      }
    })

    return NextResponse.json({
      total: activeSubscriptions
    })
  } catch (error) {
    console.error('Error fetching push subscriptions:', error)
    return NextResponse.json({ error: 'Push subscription sayısı alınamadı' }, { status: 500 })
  }
}