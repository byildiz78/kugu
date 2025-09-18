import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const settingsSchema = z.object({
  basePointRate: z.number().min(0.01).max(10, 'Puan oranı 0.01 ile 10 arasında olmalıdır'),
  menuItemsBearerToken: z.string().optional(),
  menuItemsQuery: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Session user:', session.user)

    // Get user's restaurant ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { restaurantId: true, role: true }
    })

    console.log('Found user:', user)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 400 })
    }

    // If user has no restaurant, create one for testing
    let restaurantId = user.restaurantId
    if (!restaurantId) {
      console.log('Creating default restaurant for user...')
      const restaurant = await prisma.restaurant.create({
        data: {
          name: 'Test Restaurant',
          address: 'Test Address',
          phone: '555-0123'
        }
      })

      // Update user with restaurant ID
      await prisma.user.update({
        where: { email: session.user.email! },
        data: { restaurantId: restaurant.id }
      })

      restaurantId = restaurant.id
      console.log('Created restaurant with ID:', restaurantId)
    }

    let settings = await prisma.settings.findUnique({
      where: { restaurantId }
    })

    // Create default settings if not exists
    if (!settings) {
      console.log('Creating default settings...')
      settings = await prisma.settings.create({
        data: {
          restaurantId,
          basePointRate: 0.1 // Default: 10 TL = 1 point
        }
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and restaurant staff can update settings
    if (!['ADMIN', 'RESTAURANT_ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.log('PUT Session user:', session.user)

    // Get user's restaurant ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { restaurantId: true, role: true }
    })

    console.log('PUT Found user:', user)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 400 })
    }

    // Use the restaurant ID from user (should exist after GET creates it)
    if (!user.restaurantId) {
      return NextResponse.json({ error: 'No restaurant found for user' }, { status: 400 })
    }

    const body = await request.json()
    console.log('PUT Request body:', body)

    const validatedData = settingsSchema.parse(body)
    console.log('PUT Validated data:', validatedData)

    const settings = await prisma.settings.upsert({
      where: { restaurantId: user.restaurantId },
      update: validatedData,
      create: {
        ...validatedData,
        restaurantId: user.restaurantId
      }
    })

    console.log('PUT Updated settings:', settings)
    return NextResponse.json({ settings })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors)
      return NextResponse.json({
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }
    console.error('Error updating settings:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}