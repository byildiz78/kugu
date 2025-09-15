import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyMobileToken } from '@/lib/mobile-auth'

const registrationSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
  email: z.string().email().optional(),
  birthDate: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    // Get and verify token
    const token = request.cookies.get('mobile-auth-token')?.value
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Oturum bulunamadı'
      }, { status: 401 })
    }

    const verification = await verifyMobileToken(token)
    if (!verification.valid || !verification.customer) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz oturum'
      }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = registrationSchema.parse(body)

    // Check if customer needs registration
    if (verification.customer.name && verification.customer.name.trim() !== '') {
      return NextResponse.json({
        success: false,
        error: 'Kayıt zaten tamamlanmış'
      }, { status: 400 })
    }

    // Update customer profile
    const updatedCustomer = await prisma.customer.update({
      where: { id: verification.customer.id },
      data: {
        name: validatedData.name,
        email: validatedData.email || '',
        birthDate: validatedData.birthDate ? new Date(validatedData.birthDate) : null
      },
      include: {
        tier: true,
        restaurant: {
          select: { name: true }
        }
      }
    })

    // Check for birthday segment assignment
    if (validatedData.birthDate) {
      try {
        // Find birthday segments
        const birthdaySegments = await prisma.segment.findMany({
          where: {
            name: { contains: 'birthday' },
            restaurantId: updatedCustomer.restaurantId
          }
        })

        // Assign to birthday segments
        for (const segment of birthdaySegments) {
          await prisma.customerSegment.create({
            data: {
              customerId: updatedCustomer.id,
              segmentId: segment.id
            }
          }).catch(() => {
            // Ignore if already exists
          })
        }
      } catch (error) {
        console.error('Segment assignment error:', error)
      }
    }

    return NextResponse.json({
      success: true,
      customer: updatedCustomer
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz bilgiler'
      }, { status: 400 })
    }

    console.error('Registration completion error:', error)
    return NextResponse.json({
      success: false,
      error: 'Sistem hatası'
    }, { status: 500 })
  }
}