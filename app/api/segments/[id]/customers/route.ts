import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const addCustomersSchema = z.object({
  customerIds: z.array(z.string())
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

    // Get customers in this segment
    const customerSegments = await prisma.customerSegment.findMany({
      where: {
        segmentId: params.id
      },
      include: {
        customer: {
          include: {
            _count: {
              select: { transactions: true }
            }
          }
        }
      },
      orderBy: {
        addedAt: 'desc'
      }
    })

    const customers = customerSegments.map(cs => ({
      ...cs.customer,
      addedAt: cs.addedAt
    }))

    return NextResponse.json({ customers })
  } catch (error) {
    console.error('Error fetching segment customers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { customerIds } = addCustomersSchema.parse(body)

    // Mevcut müşterileri kontrol et
    const existingRelations = await prisma.customerSegment.findMany({
      where: {
        segmentId: params.id,
        customerId: { in: customerIds }
      }
    })

    const existingCustomerIds = existingRelations.map(r => r.customerId)
    const newCustomerIds = customerIds.filter(id => !existingCustomerIds.includes(id))

    // Yeni ilişkileri oluştur
    if (newCustomerIds.length > 0) {
      await prisma.customerSegment.createMany({
        data: newCustomerIds.map(customerId => ({
          customerId,
          segmentId: params.id
        }))
      })
    }

    return NextResponse.json({ 
      message: `${newCustomerIds.length} müşteri segmente eklendi`,
      added: newCustomerIds.length,
      skipped: existingCustomerIds.length
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error adding customers to segment:', error)
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

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
    }

    await prisma.customerSegment.delete({
      where: {
        customerId_segmentId: {
          customerId,
          segmentId: params.id
        }
      }
    })

    return NextResponse.json({ message: 'Müşteri segmentten çıkarıldı' })
  } catch (error) {
    console.error('Error removing customer from segment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}