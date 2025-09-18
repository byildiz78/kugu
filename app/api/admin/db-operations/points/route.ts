import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is superadmin
    if (!session || (session.user.email !== 'superadmin@aircrm.com' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Superadmin access required'
      }, { status: 403 })
    }

    // Delete all point history records
    const deleteResult = await prisma.pointHistory.deleteMany({})

    return NextResponse.json({
      message: 'Tüm puan hareketleri başarıyla silindi',
      deletedCount: deleteResult.count,
      details: {
        pointHistory: deleteResult.count,
        note: 'Müşterilerin mevcut puan bakiyeleri korunmuştur'
      }
    })

  } catch (error) {
    console.error('Error deleting point history:', error)
    return NextResponse.json({
      error: 'Silme işlemi başarısız',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}