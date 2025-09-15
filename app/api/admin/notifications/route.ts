import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    const offset = (page - 1) * limit

    // Build where conditions
    const whereConditions: any = {}

    // Date filters
    if (startDate || endDate) {
      whereConditions.createdAt = {}
      if (startDate) {
        whereConditions.createdAt.gte = new Date(startDate + 'T00:00:00.000Z')
      }
      if (endDate) {
        whereConditions.createdAt.lte = new Date(endDate + 'T23:59:59.999Z')
      }
    }

    // Type filter
    if (type && type !== 'all') {
      whereConditions.type = type
    }

    // Search filter
    if (search) {
      whereConditions.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get total count for pagination
    const total = await prisma.notificationLog.count({ where: whereConditions })

    // Get paginated notifications
    const notifications = await prisma.notificationLog.findMany({
      where: whereConditions,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    })

    return NextResponse.json({
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Bildirimler alınamadı' }, { status: 500 })
  }
}