import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSegmentSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  rules: z.string().optional(),
  isAutomatic: z.boolean().optional(),
  criteria: z.string().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const segment = await prisma.segment.findUnique({
      where: { id: params.id },
      include: {
        restaurant: {
          select: { name: true }
        },
        customers: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                level: true,
                points: true
              }
            }
          }
        },
        _count: {
          select: { customers: true, campaigns: true }
        }
      }
    })

    if (!segment) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 })
    }

    return NextResponse.json(segment)
  } catch (error) {
    console.error('Error fetching segment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateSegmentSchema.parse(body)

    const segment = await prisma.segment.update({
      where: { id: params.id },
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

    return NextResponse.json(segment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating segment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.segment.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Segment deleted successfully' })
  } catch (error) {
    console.error('Error deleting segment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}