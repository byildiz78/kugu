import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/mobile/theme/default - Get default theme for mobile app
export async function GET(request: NextRequest) {
  try {
    // Find default theme - first try to find any active default theme
    const defaultTheme = await prisma.customTheme.findFirst({
      where: {
        isDefault: true,
        isActive: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        description: true,
        config: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (defaultTheme) {
      return NextResponse.json({
        success: true,
        theme: defaultTheme
      })
    }

    // No default theme found
    return NextResponse.json({
      success: true,
      theme: null
    })

  } catch (error) {
    console.error('Failed to fetch default theme:', error)
    return NextResponse.json(
      { error: 'Failed to fetch default theme' },
      { status: 500 }
    )
  }
}