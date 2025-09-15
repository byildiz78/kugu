import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as webpush from 'web-push'

// Configure web-push
webpush.setVapidDetails(
  'mailto:support@aircrm.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { title, body, type, targetCustomerIds } = await request.json()

    if (!title || !body || !targetCustomerIds || !Array.isArray(targetCustomerIds)) {
      return NextResponse.json({ error: 'Geçersiz bildirim verisi' }, { status: 400 })
    }

    // Get push subscriptions for target customers
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        customerId: {
          in: targetCustomerIds
        },
        isActive: true
      },
      include: {
        customer: true
      }
    })

    if (subscriptions.length === 0) {
      return NextResponse.json({ error: 'Aktif push subscription bulunamadı' }, { status: 400 })
    }

    let sentCount = 0
    let failedCount = 0
    const responses: any[] = []

    // Prepare notification payload
    const payload = JSON.stringify({
      title,
      body,
      type,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        type,
        url: getNotificationUrl(type)
      }
    })

    // Send notifications
    for (const subscription of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dhKey,
            auth: subscription.authKey
          }
        }

        const response = await webpush.sendNotification(pushSubscription, payload)
        sentCount++
        responses.push({
          customerId: subscription.customerId,
          success: true,
          statusCode: response.statusCode
        })

        // Update last used date
        await prisma.pushSubscription.update({
          where: { id: subscription.id },
          data: { lastUsedAt: new Date() }
        })

      } catch (error: any) {
        failedCount++
        console.error(`Failed to send notification to ${subscription.customerId}:`, error)
        
        responses.push({
          customerId: subscription.customerId,
          success: false,
          error: error.message
        })

        // If subscription is invalid, mark as inactive
        if (error.statusCode === 410) {
          await prisma.pushSubscription.update({
            where: { id: subscription.id },
            data: { isActive: false }
          })
        }
      }
    }

    // Log notification
    const notificationLog = await prisma.notificationLog.create({
      data: {
        title,
        body,
        type,
        targetCustomerIds: JSON.stringify(targetCustomerIds),
        sentCount,
        failedCount,
        webPushResponse: JSON.stringify(responses)
      }
    })

    return NextResponse.json({
      id: notificationLog.id,
      sentCount,
      failedCount,
      totalTargets: subscriptions.length,
      success: true
    })

  } catch (error) {
    console.error('Error sending notification:', error)
    return NextResponse.json({ error: 'Bildirim gönderilemedi' }, { status: 500 })
  }
}

function getNotificationUrl(type: string): string {
  switch (type) {
    case 'CAMPAIGN':
      return '/mobile/campaigns'
    case 'REWARD':
      return '/mobile/rewards'
    case 'POINTS':
      return '/mobile/profile'
    default:
      return '/mobile/dashboard'
  }
}