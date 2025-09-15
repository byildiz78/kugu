import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'Valid session or Bearer token required' 
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
    }

    const skip = (page - 1) * limit

    // Fetch notifications from database that were sent to this customer
    const notifications = await prisma.notificationLog.findMany({
      where: {
        targetCustomerIds: {
          contains: customerId
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    // Get total count for pagination
    const totalCount = await prisma.notificationLog.count({
      where: {
        targetCustomerIds: {
          contains: customerId
        }
      }
    })

    // Transform data to match expected format
    const transformedNotifications = notifications.map(notification => ({
      id: notification.id,
      title: notification.title,
      message: notification.body,
      body: notification.body,
      type: notification.type,
      status: 'DELIVERED',
      createdAt: notification.createdAt.toISOString(),
      data: null
    }))

    // Fallback to mock data if no notifications found (for demo purposes)
    const mockNotifications = totalCount === 0 ? [
      {
        id: '1',
        title: '🎉 Yeni Kampanya!',
        message: '5 al 1 bedava kampanyamız başladı! Hemen faydalanın.',
        body: '5 al 1 bedava kampanyamız başladı! Hemen faydalanın.',
        type: 'CAMPAIGN',
        status: 'DELIVERED',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        data: null
      },
      {
        id: '2',
        title: '🎁 Ödülünüz Hazır',
        message: 'Tebrikler! Yeni bir ödül kazandınız. Ödüllerim sayfasından görüntüleyebilirsiniz.',
        body: 'Tebrikler! Yeni bir ödül kazandınız. Ödüllerim sayfasından görüntüleyebilirsiniz.',
        type: 'REWARD',
        status: 'READ',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        data: null
      },
      {
        id: '3',
        title: '📢 Önemli Duyuru',
        message: 'Yarın bakım çalışması nedeniyle 10:00-12:00 arası hizmet verilemeyecektir.',
        body: 'Yarın bakım çalışması nedeniyle 10:00-12:00 arası hizmet verilemeyecektir.',
        type: 'BROADCAST',
        status: 'SENT',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        data: null
      },
      {
        id: '4',
        title: '⚠️ Puan Güncellemesi',
        message: 'Son alışverişinizden 50 puan kazandınız! Güncel puanınız: 250',
        body: 'Son alışverişinizden 50 puan kazandınız! Güncel puanınız: 250',
        type: 'INFO',
        status: 'DELIVERED',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        data: { points: 50, totalPoints: 250 }
      },
      {
        id: '5',
        title: '🎂 Doğum Günü İndirimi',
        message: 'Doğum gününüz yaklaşıyor! Size özel %20 indirim kuponunuz tanımlandı.',
        body: 'Doğum gününüz yaklaşıyor! Size özel %20 indirim kuponunuz tanımlandı.',
        type: 'CAMPAIGN',
        status: 'SENT',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        data: { discountPercent: 20 }
      }
    ] : []

    // Use real data if available, otherwise fallback to mock data
    const finalNotifications = transformedNotifications.length > 0 ? transformedNotifications : mockNotifications
    const total = totalCount > 0 ? totalCount : mockNotifications.length

    return NextResponse.json({
      notifications: finalNotifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching notification history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}