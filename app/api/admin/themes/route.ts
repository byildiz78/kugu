import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

// GET /api/admin/themes - Get all custom themes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')

    // If restaurantId provided, get specific theme
    if (restaurantId) {
      const theme = await prisma.customTheme.findFirst({
        where: { restaurantId },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json({ theme })
    }

    // Get all themes - handle case where table might be empty
    let themes: any[] = []
    try {
      themes = await prisma.customTheme.findMany({
        include: {
          _count: {
            select: { customers: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      console.error('CustomTheme table query failed:', error)
      // Return empty array if table doesn't exist or has issues
      themes = []
    }

    return NextResponse.json({ themes })
  } catch (error) {
    console.error('Failed to fetch themes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch themes' },
      { status: 500 }
    )
  }
}

// POST /api/admin/themes - Create or update theme
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      name, 
      config, 
      description,
      isActive = true,
      isDefault = false 
    } = body

    // Get restaurantId from session (for now use default)
    const restaurantId = 'default-restaurant-id' // TODO: Get from user session

    // Validate required fields
    if (!name || !config) {
      return NextResponse.json(
        { error: 'name and config are required' },
        { status: 400 }
      )
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.customTheme.updateMany({
        where: { restaurantId, isDefault: true },
        data: { isDefault: false }
      })
    }

    // Check if theme exists for this restaurant
    let existingTheme = null
    try {
      existingTheme = await prisma.customTheme.findFirst({
        where: { restaurantId, name }
      })
    } catch (error) {
      console.error('Failed to check existing theme:', error)
      // Continue with creation if check fails
    }

    let theme
    if (existingTheme) {
      // Update existing theme
      theme = await prisma.customTheme.update({
        where: { id: existingTheme.id },
        data: {
          description: description || null,
          config: config as any,
          isActive,
          isDefault,
          updatedAt: new Date()
        }
      })
    } else {
      // Create new theme
      theme = await prisma.customTheme.create({
        data: {
          restaurantId,
          name,
          description: description || null,
          config: config as any,
          isActive,
          isDefault
        }
      })
    }

    return NextResponse.json({ theme })
  } catch (error) {
    console.error('Failed to save theme:', error)
    return NextResponse.json(
      { error: 'Failed to save theme' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/themes/[id] - Delete theme
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Theme ID is required' }, { status: 400 })
    }

    // Check if theme exists
    const theme = await prisma.customTheme.findUnique({
      where: { id }
    })

    if (!theme) {
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 })
    }

    // Don't allow deleting default theme
    if (theme.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default theme' },
        { status: 400 }
      )
    }

    await prisma.customTheme.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete theme:', error)
    return NextResponse.json(
      { error: 'Failed to delete theme' },
      { status: 500 }
    )
  }
}