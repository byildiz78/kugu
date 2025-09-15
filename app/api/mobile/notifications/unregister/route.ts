import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth-utils'
import { z } from 'zod'

const unregisterSubscriptionSchema = z.object({
  customerId: z.string(),
  subscription: z.object({
    endpoint: z.string()
  })
})

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
    const validatedData = unregisterSubscriptionSchema.parse(body)

    // Find and deactivate the subscription
    const subscription = await prisma.pushSubscription.findFirst({
      where: {
        customerId: validatedData.customerId,
        endpoint: validatedData.subscription.endpoint
      }
    })

    if (subscription) {
      await prisma.pushSubscription.update({
        where: { id: subscription.id },
        data: {
          isActive: false,
          lastUsedAt: new Date()
        }
      })

      return NextResponse.json({ message: 'Subscription unregistered successfully' })
    } else {
      return NextResponse.json({ message: 'Subscription not found' }, { status: 404 })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error unregistering FCM token:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}