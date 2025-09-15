import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { authenticateRequest } from '@/lib/auth-utils'

const updateCustomerSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  points: z.number().optional(),
  level: z.enum(['REGULAR', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM']).optional()
})

// Calculate customer stamp entitlements for free products
async function calculateStampEntitlements(customerId: string, restaurantId: string) {
  // Get all active Buy X Get Y campaigns with free products for this restaurant
  const campaigns = await prisma.campaign.findMany({
    where: {
      restaurantId: restaurantId,
      isActive: true,
      type: 'PRODUCT_BASED',
      buyQuantity: { not: null },
      freeProducts: { not: null }, // Only campaigns with free products
      AND: [
        { startDate: { lte: new Date() } },
        { endDate: { gte: new Date() } }
      ]
    },
    select: {
      id: true,
      name: true,
      buyQuantity: true,
      getQuantity: true,
      targetProducts: true,
      targetCategories: true,
      freeProducts: true,
      discountValue: true,
      discountType: true,
      maxUsagePerCustomer: true,
      startDate: true
    }
  })

  const entitlements = []

  for (const campaign of campaigns) {
    let targetProductIds: string[] = []
    let freeProductIds: string[] = []
    
    // Parse target products
    if (campaign.targetProducts) {
      try {
        targetProductIds = JSON.parse(campaign.targetProducts)
      } catch (e) {
        targetProductIds = []
      }
    }

    // Parse free products
    if (campaign.freeProducts) {
      try {
        freeProductIds = JSON.parse(campaign.freeProducts)
      } catch (e) {
        freeProductIds = []
      }
    }

    if (freeProductIds.length === 0) continue

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
    
    // Get product details for free products
    const freeProducts = await prisma.product.findMany({
      where: {
        id: { in: freeProductIds },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        price: true,
        category: true
      }
    })

    if (stampsAvailable > 0 && freeProducts.length > 0) {
      // Calculate total free items available
      const getQuantity = campaign.getQuantity || 1
      const totalFreeItems = stampsAvailable * getQuantity

      entitlements.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        stampsAvailable,
        totalFreeItems,
        freeProducts: freeProducts.map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          category: product.category,
          availableQuantity: totalFreeItems // Each stamp gives access to getQuantity free items
        }))
      })
    }
  }

  return {
    entitlements,
    totalAvailableStamps: entitlements.reduce((sum, ent) => sum + ent.stampsAvailable, 0),
    totalFreeItems: entitlements.reduce((sum, ent) => sum + ent.totalFreeItems, 0)
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'Valid session or Bearer token required' 
      }, { status: 401 })
    }

    // Check if the ID looks like a phone number (starts with + or contains only digits)
    const isPhoneNumber = /^[\+]?[0-9\s\-\(\)]+$/.test(params.id)
    
    const customer = await prisma.customer.findFirst({
      where: isPhoneNumber ? { phone: params.id } : { id: params.id },
      include: {
        restaurant: {
          select: { name: true }
        },
        tier: {
          select: {
            id: true,
            name: true,
            displayName: true,
            color: true,
            gradient: true,
            icon: true,
            level: true,
            pointMultiplier: true,
            discountPercent: true,
            specialFeatures: true
          }
        },
        transactions: {
          orderBy: { transactionDate: 'desc' },
          take: 10,
          include: {
            items: true,
            tier: {
              select: {
                displayName: true,
                pointMultiplier: true
              }
            }
          }
        },
        rewards: {
          where: {
            isRedeemed: false,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          },
          include: {
            reward: {
              select: {
                name: true,
                description: true,
                type: true,
                category: true,
                pointsCost: true,
                value: true
              }
            }
          }
        },
        segments: {
          include: {
            segment: {
              select: { name: true, description: true }
            }
          }
        },
        pointHistory: {
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        _count: {
          select: { 
            transactions: true, 
            rewards: true,
            pointHistory: true
          }
        }
      }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Get active campaigns available for this customer
    const now = new Date()
    const activeCampaigns = await prisma.campaign.findMany({
      where: {
        restaurantId: customer.restaurantId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
        OR: [
          { segments: { none: {} } }, // Campaigns without segment restrictions
          { segments: { some: { id: { in: customer.segments.map(s => s.segmentId) } } } } // Campaigns for customer's segments
        ]
      },
      include: {
        _count: {
          select: { 
            usages: true,
            transactions: true 
          }
        },
        usages: {
          where: { customerId: customer.id }
        }
      }
    })

    // Calculate total usage count for each campaign including stamp-based usages
    const campaignsWithUsageCount = await Promise.all(
      activeCampaigns.map(async (campaign) => {
        let totalUsageCount = campaign._count.usages
        
        // For Buy X Get Y campaigns (PRODUCT_BASED with buyQuantity), also count TransactionCampaign entries
        if (campaign.type === 'PRODUCT_BASED' && campaign.buyQuantity) {
          const stampUsages = await prisma.transactionCampaign.count({
            where: {
              campaignId: campaign.id
            }
          })
          totalUsageCount += stampUsages
        }
        
        return {
          ...campaign,
          _count: {
            ...campaign._count,
            usages: totalUsageCount
          }
        }
      })
    )

    // Filter campaigns based on usage limits
    const availableCampaigns = campaignsWithUsageCount.filter(campaign => {
      // Check max usage per customer
      if (campaign.maxUsagePerCustomer && campaign.usages.length >= campaign.maxUsagePerCustomer) {
        return false
      }
      // Check max total usage
      if (campaign.maxUsage && campaign._count.usages >= campaign.maxUsage) {
        return false
      }
      return true
    })

    // Get customer stamp progress and free product entitlements
    const stampEntitlements = await calculateStampEntitlements(customer.id, customer.restaurantId)

    // Calculate customer statistics
    const stats = {
      totalSpent: customer.totalSpent,
      totalVisits: customer.visitCount,
      averageSpent: customer.visitCount > 0 ? customer.totalSpent / customer.visitCount : 0,
      currentPoints: customer.points,
      totalPointsEarned: await prisma.pointHistory.aggregate({
        where: {
          customerId: customer.id,
          type: 'EARNED',
          amount: { gt: 0 }
        },
        _sum: { amount: true }
      }).then(result => result._sum.amount || 0),
      totalPointsSpent: await prisma.pointHistory.aggregate({
        where: {
          customerId: customer.id,
          type: 'SPENT',
          amount: { lt: 0 }
        },
        _sum: { amount: true }
      }).then(result => Math.abs(result._sum.amount || 0))
    }

    return NextResponse.json({ 
      customer,
      availableCampaigns,
      stampEntitlements,
      stats
    })
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'Valid session or Bearer token required' 
      }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateCustomerSchema.parse(body)

    // Check if the ID looks like a phone number
    const isPhoneNumber = /^[\+]?[0-9\s\-\(\)]+$/.test(params.id)

    const customer = await prisma.customer.update({
      where: isPhoneNumber ? { phone: params.id } : { id: params.id },
      data: {
        ...validatedData,
        birthDate: validatedData.birthDate ? new Date(validatedData.birthDate) : undefined
      },
      include: {
        restaurant: {
          select: { name: true }
        }
      }
    })

    return NextResponse.json(customer)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating customer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'Valid session or Bearer token required' 
      }, { status: 401 })
    }

    // Check if the ID looks like a phone number
    const isPhoneNumber = /^[\+]?[0-9\s\-\(\)]+$/.test(params.id)

    await prisma.customer.delete({
      where: isPhoneNumber ? { phone: params.id } : { id: params.id }
    })

    return NextResponse.json({ message: 'Customer deleted successfully' })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}