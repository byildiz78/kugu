import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const productSchema = z.object({
  name: z.string().min(2, 'Ürün adı en az 2 karakter olmalıdır'),
  description: z.string().optional(),
  category: z.string().min(1, 'Kategori seçilmelidir'),
  price: z.number().min(0.01, 'Fiyat 0\'dan büyük olmalıdır'),
  isActive: z.boolean().default(true)
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    const skip = (page - 1) * limit

    const where: any = {}

    // Filter by restaurant if user is not admin
    if (session.user.role !== 'ADMIN') {
      where.restaurantId = (session.user as any).restaurantId
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (category && category !== 'ALL') {
      where.category = category
    }

    if (status && status !== 'ALL') {
      where.isActive = status === 'ACTIVE'
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          restaurant: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ])

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and restaurant staff can create products
    if (!['ADMIN', 'RESTAURANT_ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, category, price, isActive } = body

    // Validate required fields
    if (!name || !category || price === undefined) {
      return NextResponse.json({ 
        error: 'Name, category, and price are required' 
      }, { status: 400 })
    }

    // Determine restaurant ID
    let restaurantId = (session.user as any).restaurantId
    
    // If admin, they need to specify restaurant or have a default one
    if (session.user.role === 'ADMIN' && !restaurantId) {
      // For demo purposes, get the first restaurant
      const firstRestaurant = await prisma.restaurant.findFirst()
      if (!firstRestaurant) {
        return NextResponse.json({ 
          error: 'No restaurant found' 
        }, { status: 400 })
      }
      restaurantId = firstRestaurant.id
    }

    // Check if product with same name exists in the restaurant
    const existingProduct = await prisma.product.findFirst({
      where: { 
        name,
        restaurantId 
      }
    })

    if (existingProduct) {
      return NextResponse.json({ 
        error: 'Bu restoranda aynı isimde bir ürün zaten mevcut' 
      }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        category,
        price: parseFloat(price),
        isActive: isActive !== false, // Default to true
        restaurantId
      },
      include: {
        restaurant: {
          select: { name: true }
        }
      }
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}