import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'Valid session or Bearer token required' 
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    
    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
    }

    // Get all active Buy X Get Y campaigns for this restaurant
    const campaigns = await prisma.campaign.findMany({
      where: {
        isActive: true,
        type: 'PRODUCT_BASED', // Buy X Get Y campaigns are stored as PRODUCT_BASED
        buyQuantity: { not: null }, // Has buyQuantity requirement
        AND: [
          { startDate: { lte: new Date() } },
          { endDate: { gte: new Date() } }
        ]
      },
      select: {
        id: true,
        name: true,
        buyQuantity: true,
        targetProducts: true,
        targetCategories: true,
        discountValue: true,
        discountType: true,
        maxUsagePerCustomer: true,
        startDate: true
      }
    })

    const stampProgress = []

    for (const campaign of campaigns) {
      // Count customer's qualifying transactions for this campaign
      let targetProductIds: string[] = []
      
      if (campaign.targetProducts) {
        try {
          targetProductIds = JSON.parse(campaign.targetProducts)
        } catch (e) {
          targetProductIds = []
        }
      }

      // Get customer's transactions that qualify for this campaign (exclude free items)
      const qualifyingTransactions = await prisma.transactionItem.findMany({
        where: {
          transaction: {
            customerId: customerId,
            status: 'COMPLETED',
            createdAt: {
              gte: campaign.startDate || new Date(0)
            }
          },
          isFree: false, // Only count paid items for stamps
          ...(targetProductIds.length > 0 && {
            productId: { in: targetProductIds }
          })
        },
        select: {
          quantity: true,
          transaction: {
            select: {
              id: true,
              createdAt: true
            }
          }
        }
      })

      // Calculate total quantity purchased
      const totalPurchased = qualifyingTransactions.reduce((sum, item) => sum + item.quantity, 0)
      
      // Calculate stamps earned (how many complete sets of buyQuantity)
      const stampsEarned = Math.floor(totalPurchased / (campaign.buyQuantity || 1))
      
      // Get how many times this campaign was already used
      const campaignUsages = await prisma.transactionCampaign.count({
        where: {
          campaignId: campaign.id,
          transaction: {
            customerId: customerId
          }
        }
      })

      // Calculate remaining stamps
      const stampsUsed = campaignUsages
      const stampsAvailable = Math.max(0, stampsEarned - stampsUsed)
      
      // Progress towards next stamp
      const remainingForNextStamp = (campaign.buyQuantity || 1) - (totalPurchased % (campaign.buyQuantity || 1))
      const progressToNext = totalPurchased % (campaign.buyQuantity || 1)

      // Check if max usage limit reached
      const maxUsage = campaign.maxUsagePerCustomer || 999
      const canEarnMore = stampsEarned < maxUsage

      stampProgress.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        buyQuantity: campaign.buyQuantity,
        totalPurchased,
        stampsEarned,
        stampsUsed,
        stampsAvailable,
        progressToNext,
        remainingForNextStamp: canEarnMore ? remainingForNextStamp : 0,
        discountValue: campaign.discountValue,
        discountType: campaign.discountType,
        maxUsage,
        canEarnMore
      })
    }

    return NextResponse.json({
      customerId,
      stamps: stampProgress,
      totalActiveStamps: stampProgress.reduce((sum, stamp) => sum + stamp.stampsAvailable, 0)
    })

  } catch (error) {
    console.error('Error fetching customer stamps:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}