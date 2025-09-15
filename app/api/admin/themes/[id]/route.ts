import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

// PUT /api/admin/themes/[id] - Update theme
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const themeId = params.id
    const body = await request.json()
    const { 
      name, 
      description,
      config, 
      isActive = true,
      isDefault = false 
    } = body

    // Validate required fields
    if (!name || !config) {
      return NextResponse.json(
        { error: 'name and config are required' },
        { status: 400 }
      )
    }

    // Check if theme exists
    const existingTheme = await prisma.customTheme.findUnique({
      where: { id: themeId }
    })

    if (!existingTheme) {
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 })
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.customTheme.updateMany({
        where: { 
          restaurantId: existingTheme.restaurantId, 
          isDefault: true,
          id: { not: themeId }
        },
        data: { isDefault: false }
      })
    }

    // Update theme
    const updatedTheme = await prisma.customTheme.update({
      where: { id: themeId },
      data: {
        name,
        description,
        config: config as any,
        isActive,
        isDefault,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ theme: updatedTheme })

  } catch (error) {
    console.error('Failed to update theme:', error)
    return NextResponse.json(
      { error: 'Failed to update theme' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/themes/[id] - Delete theme
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const themeId = params.id

    // Check if theme exists
    const theme = await prisma.customTheme.findUnique({
      where: { id: themeId }
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
      where: { id: themeId }
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