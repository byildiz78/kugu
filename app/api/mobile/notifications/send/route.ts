import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth-utils'
import { z } from 'zod'
import * as webpush from 'web-push'

// Configure web-push with VAPID keys
try {
  webpush.setVapidDetails(
    'mailto:admin@aircrm.com',
    process.env.VAPID_PUBLIC_KEY || '',
    process.env.VAPID_PRIVATE_KEY || ''
  )
  console.log('Web-push configured successfully')
} catch (error) {
  console.error('Web-push configuration error:', error)
}

const sendNotificationSchema = z.object({
  customerId: z.string().optional(),
  customerIds: z.array(z.string()).optional(),
  title: z.string(),
  body: z.string(),
  data: z.object({
    type: z.enum(['CAMPAIGN', 'REWARD', 'POINTS', 'GENERAL']),
    campaignId: z.string().optional(),
    rewardId: z.string().optional(),
    url: z.string().optional()
  }).optional(),
  icon: z.string().optional(),
  scheduledAt: z.string().optional() // ISO date string for scheduled notifications
})

export async function POST(request: NextRequest) {
  try {
    console.log('Send notification endpoint called')
    
    const auth = await authenticateRequest(request)
    if (!auth.isAuthenticated) {
      console.log('Authentication failed')
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'Valid session or Bearer token required' 
      }, { status: 401 })
    }

    const body = await request.json()
    console.log('Request body:', body)
    
    const validatedData = sendNotificationSchema.parse(body)
    console.log('Validated data:', validatedData)

    // Determine target customer IDs
    let targetCustomerIds: string[] = []
    if (validatedData.customerId) {
      targetCustomerIds = [validatedData.customerId]
    } else if (validatedData.customerIds) {
      targetCustomerIds = validatedData.customerIds
    } else {
      return NextResponse.json({ error: 'Customer ID(s) required' }, { status: 400 })
    }

    // Get active push subscriptions for target customers
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        customerId: { in: targetCustomerIds },
        isActive: true
      },
      include: {
        customer: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (subscriptions.length === 0) {
      return NextResponse.json({ 
        error: 'No active push subscriptions found for target customers' 
      }, { status: 404 })
    }

    // Prepare notification payload
    const payload = {
      title: validatedData.title,
      body: validatedData.body,
      icon: validatedData.icon || '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: validatedData.data || { type: 'GENERAL' }
    }

    // Send notifications
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dhKey,
            auth: sub.authKey
          }
        }

        try {
          await webpush.sendNotification(pushSubscription, JSON.stringify(payload))
          return { success: true, subscriptionId: sub.id }
        } catch (error: any) {
          console.error(`Failed to send notification to subscription ${sub.id}:`, error)
          
          // Check if subscription is invalid and should be deactivated
          if (error.statusCode === 410 || error.statusCode === 404) {
            await prisma.pushSubscription.update({
              where: { id: sub.id },
              data: { isActive: false }
            })
          }
          
          return { success: false, subscriptionId: sub.id, error: error.message }
        }
      })
    )

    // Count successes and failures
    const successCount = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length
    const failureCount = results.length - successCount

    // Log notification in database
    const notificationLog = await prisma.notificationLog.create({
      data: {
        title: validatedData.title,
        body: validatedData.body,
        type: validatedData.data?.type || 'GENERAL',
        targetCustomerIds: JSON.stringify(targetCustomerIds),
        sentCount: successCount,
        failedCount: failureCount,
        webPushResponse: JSON.stringify(results)
      }
    })

    // Update successful subscriptions' last used date
    const successfulSubscriptionIds = results
      .filter(result => result.status === 'fulfilled' && result.value.success)
      .map(result => (result as any).value.subscriptionId)

    if (successfulSubscriptionIds.length > 0) {
      await prisma.pushSubscription.updateMany({
        where: { id: { in: successfulSubscriptionIds } },
        data: { lastUsedAt: new Date() }
      })
    }

    return NextResponse.json({
      message: 'Notification sent successfully',
      successCount,
      failureCount,
      notificationId: notificationLog.id,
      details: results
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error sending notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}