import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth-utils'
import { z } from 'zod'

const registerSubscriptionSchema = z.object({
  customerId: z.string(),
  subscription: z.object({
    endpoint: z.string(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string()
    })
  }),
  platform: z.enum(['web', 'android', 'ios']).default('web').transform((val) => val.toUpperCase()),
  userAgent: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Register subscription endpoint called')
    
    const auth = await authenticateRequest(request)
    if (!auth.isAuthenticated) {
      console.log('❌ Authentication failed')
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'Valid session or Bearer token required' 
      }, { status: 401 })
    }

    const body = await request.json()
    console.log('📡 Register request body:', body)
    
    const validatedData = registerSubscriptionSchema.parse(body)
    console.log('✅ Validated subscription data:', validatedData)

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: validatedData.customerId }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Check if subscription already exists
    const existingSubscription = await prisma.pushSubscription.findFirst({
      where: {
        customerId: validatedData.customerId,
        endpoint: validatedData.subscription.endpoint
      }
    })

    if (existingSubscription) {
      // Update existing subscription
      const updatedSubscription = await prisma.pushSubscription.update({
        where: { id: existingSubscription.id },
        data: {
          p256dhKey: validatedData.subscription.keys.p256dh,
          authKey: validatedData.subscription.keys.auth,
          platform: validatedData.platform as any,
          userAgent: validatedData.userAgent,
          isActive: true,
          lastUsedAt: new Date()
        }
      })

      return NextResponse.json({ 
        message: 'Subscription updated successfully',
        subscriptionId: updatedSubscription.id
      })
    } else {
      // Create new subscription
      const newSubscription = await prisma.pushSubscription.create({
        data: {
          customerId: validatedData.customerId,
          endpoint: validatedData.subscription.endpoint,
          p256dhKey: validatedData.subscription.keys.p256dh,
          authKey: validatedData.subscription.keys.auth,
          platform: validatedData.platform as any,
          userAgent: validatedData.userAgent,
          isActive: true,
          lastUsedAt: new Date()
        }
      })

      return NextResponse.json({ 
        message: 'Subscription registered successfully',
        subscriptionId: newSubscription.id
      }, { status: 201 })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Zod validation error:', error.errors)
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('❌ Error registering push subscription:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}