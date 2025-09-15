import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

// PATCH /api/admin/themes/[id]/make-default - Make theme default
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const themeId = params.id

    // Find the theme
    const theme = await prisma.customTheme.findUnique({
      where: { id: themeId }
    })

    if (!theme) {
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 })
    }

    // Start transaction to update default themes
    await prisma.$transaction(async (tx) => {
      // First, set all themes for this restaurant to non-default
      await tx.customTheme.updateMany({
        where: { 
          restaurantId: theme.restaurantId,
          isDefault: true 
        },
        data: { isDefault: false }
      })

      // Then, set this theme as default
      await tx.customTheme.update({
        where: { id: themeId },
        data: { 
          isDefault: true,
          isActive: true // Ensure it's also active
        }
      })
    })

    return NextResponse.json({ 
      success: true,
      message: 'Theme set as default successfully'
    })

  } catch (error) {
    console.error('Failed to make theme default:', error)
    return NextResponse.json(
      { error: 'Failed to make theme default' },
      { status: 500 }
    )
  }
}