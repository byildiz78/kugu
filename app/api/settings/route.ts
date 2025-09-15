import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const settingsSchema = z.object({
  basePointRate: z.number().min(0.01).max(10, 'Puan oranı 0.01 ile 10 arasında olmalıdır')
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const restaurantId = 'default-restaurant-id' // TODO: Get from session

    let settings = await prisma.settings.findUnique({
      where: { restaurantId }
    })

    // Create default settings if not exists
    if (!settings) {
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    const body = await request.json()
    const validatedData = settingsSchema.parse(body)

    const restaurantId = 'default-restaurant-id' // TODO: Get from session

    const settings = await prisma.settings.upsert({
      where: { restaurantId },
      update: validatedData,
      create: {
        ...validatedData,
        restaurantId
      }
    })

    return NextResponse.json({ settings })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}