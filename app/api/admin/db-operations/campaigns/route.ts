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

    // Delete all campaign usage records and related transaction campaigns
    const result = await prisma.$transaction(async (tx) => {
      // Count before delete
      const campaignUsageCount = await tx.campaignUsage.count()
      const transactionCampaignCount = await tx.transactionCampaign.count()

      // Delete CampaignUsage records
      const campaignUsageResult = await tx.campaignUsage.deleteMany({})

      // Delete TransactionCampaign records (for stamp tracking)
      const transactionCampaignResult = await tx.transactionCampaign.deleteMany({})

      return {
        campaignUsage: campaignUsageResult.count,
        transactionCampaign: transactionCampaignResult.count,
        totalDeleted: campaignUsageResult.count + transactionCampaignResult.count
      }
    })

    return NextResponse.json({
      message: 'Tüm kampanya kullanım geçmişi başarıyla silindi',
      deletedCount: result.totalDeleted,
      details: {
        campaignUsage: result.campaignUsage,
        transactionCampaign: result.transactionCampaign,
        note: 'Kampanya tanımları ve ayarları korunmuştur'
      }
    })

  } catch (error) {
    console.error('Error deleting campaign usage:', error)
    return NextResponse.json({
      error: 'Silme işlemi başarısız',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}