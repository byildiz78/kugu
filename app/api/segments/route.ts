import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const segmentSchema = z.object({
  name: z.string().min(2, 'Segment adı en az 2 karakter olmalıdır'),
  description: z.string().optional(),
  rules: z.string().optional(),
  restaurantId: z.string(),
  isAutomatic: z.boolean().default(false),
  criteria: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {}

    const [segments, total] = await Promise.all([
      prisma.segment.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          rules: true,
          isAutomatic: true,
          criteria: true,
          restaurantId: true,
          createdAt: true,
          updatedAt: true,
          restaurant: {
            select: { name: true }
          },
          _count: {
            select: { customers: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.segment.count({ where })
    ])

    return NextResponse.json({
      segments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching segments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = segmentSchema.parse(body)

    const segment = await prisma.segment.create({
      data: validatedData,
      include: {
        restaurant: {
          select: { name: true }
        },
        _count: {
          select: { customers: true }
        }
      }
    })

    return NextResponse.json(segment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating segment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}