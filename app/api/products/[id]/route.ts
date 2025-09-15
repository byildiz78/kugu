import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        restaurant: {
          select: { name: true }
        }
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if user has access to this product
    if (session.user.role !== 'ADMIN' && product.restaurantId !== (session.user as any).restaurantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error fetching product:', error)
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

    // Only admins and restaurant staff can update products
    if (!['ADMIN', 'RESTAURANT_ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, category, price, isActive } = body

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if user has access to this product
    if (session.user.role !== 'ADMIN' && existingProduct.restaurantId !== (session.user as any).restaurantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if name is already taken by another product in the same restaurant
    if (name && name !== existingProduct.name) {
      const nameConflict = await prisma.product.findFirst({
        where: { 
          name,
          restaurantId: existingProduct.restaurantId,
          id: { not: params.id }
        }
      })

      if (nameConflict) {
        return NextResponse.json({ 
          error: 'Bu restoranda aynı isimde başka bir ürün zaten mevcut' 
        }, { status: 400 })
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description || null
    if (category !== undefined) updateData.category = category
    if (price !== undefined) updateData.price = parseFloat(price)
    if (isActive !== undefined) updateData.isActive = isActive

    const product = await prisma.product.update({
      where: { id: params.id },
      data: updateData,
      include: {
        restaurant: {
          select: { name: true }
        }
      }
    })

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error updating product:', error)
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

    // Only admins and restaurant staff can delete products
    if (!['ADMIN', 'RESTAURANT_ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if user has access to this product
    if (session.user.role !== 'ADMIN' && existingProduct.restaurantId !== (session.user as any).restaurantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if product is used in any transactions
    const transactionItems = await prisma.transactionItem.findFirst({
      where: { productName: existingProduct.name }
    })

    if (transactionItems) {
      return NextResponse.json({ 
        error: 'Bu ürün satış kayıtlarında kullanıldığı için silinemez. Bunun yerine pasif hale getirebilirsiniz.' 
      }, { status: 400 })
    }

    await prisma.product.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}