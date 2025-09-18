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

    // Use transaction to ensure all related data is deleted
    const result = await prisma.$transaction(async (tx) => {
      // Count before delete
      const customerCount = await tx.customer.count()

      // Delete in correct order to respect foreign key constraints

      // 1. Delete TransactionCampaign (references Transaction)
      await tx.transactionCampaign.deleteMany({})

      // 2. Delete TransactionItem (references Transaction)
      await tx.transactionItem.deleteMany({})

      // 3. Delete Transaction (references Customer)
      await tx.transaction.deleteMany({})

      // 4. Delete CampaignUsage (references Customer)
      await tx.campaignUsage.deleteMany({})

      // 5. Delete CustomerReward (references Customer)
      await tx.customerReward.deleteMany({})

      // 6. Delete CustomerSegment (references Customer)
      await tx.customerSegment.deleteMany({})

      // 7. Delete PointHistory (references Customer)
      await tx.pointHistory.deleteMany({})

      // 8. Delete TierHistory (references Customer)
      await tx.tierHistory.deleteMany({})

      // 9. Delete PushSubscription if exists (references Customer)
      try {
        await tx.pushSubscription.deleteMany({})
      } catch (e) {
        // Table might not exist
      }

      // 10. Finally delete all customers
      const deleteResult = await tx.customer.deleteMany({})

      return {
        deletedCount: deleteResult.count,
        originalCount: customerCount
      }
    })

    return NextResponse.json({
      message: 'Tüm müşteri verileri başarıyla silindi',
      deletedCount: result.deletedCount,
      details: {
        customers: result.deletedCount,
        relatedData: 'Tüm ilişkili veriler (işlemler, puanlar, kampanya kullanımları vb.) silindi'
      }
    })

  } catch (error) {
    console.error('Error deleting customers:', error)
    return NextResponse.json({
      error: 'Silme işlemi başarısız',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}