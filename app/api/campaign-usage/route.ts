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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const campaignId = searchParams.get('campaignId')
    const customerId = searchParams.get('customerId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (startDate) {
      where.usedAt = {
        ...where.usedAt,
        gte: new Date(startDate)
      }
    }

    if (endDate) {
      where.usedAt = {
        ...where.usedAt,
        lte: new Date(endDate + 'T23:59:59.999Z')
      }
    }

    if (campaignId) {
      where.campaignId = campaignId
    }

    if (customerId) {
      where.customerId = customerId
    }

    // Get campaign usages with related data
    const [usages, total, summary] = await Promise.all([
      prisma.campaignUsage.findMany({
        where,
        skip,
        take: limit,
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
              type: true,
              discountType: true,
              discountValue: true
            }
          },
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              tier: {
                select: {
                  name: true,
                  displayName: true,
                  color: true
                }
              }
            }
          }
        },
        orderBy: { usedAt: 'desc' }
      }),
      prisma.campaignUsage.count({ where }),
      prisma.campaignUsage.aggregate({
        where,
        _sum: {
          orderAmount: true,
          discountAmount: true
        },
        _count: true
      })
    ])

    // Get unique campaigns and customers count
    const [uniqueCampaigns, uniqueCustomers] = await Promise.all([
      prisma.campaignUsage.groupBy({
        by: ['campaignId'],
        where,
        _count: true
      }),
      prisma.campaignUsage.groupBy({
        by: ['customerId'],
        where,
        _count: true
      })
    ])

    // Get campaign type breakdown using Prisma group by
    const campaignTypeData = await prisma.campaignUsage.groupBy({
      by: ['campaignId'],
      where,
      _count: true,
      _sum: {
        discountAmount: true
      }
    })

    // Get campaign details for type breakdown
    const campaignDetails = await prisma.campaign.findMany({
      where: {
        id: { in: campaignTypeData.map(d => d.campaignId) }
      },
      select: {
        id: true,
        type: true
      }
    })

    // Group by type
    const typeMap = new Map<string, { usage_count: number; total_discount: number }>()

    campaignTypeData.forEach(data => {
      const campaign = campaignDetails.find(c => c.id === data.campaignId)
      if (campaign) {
        const existing = typeMap.get(campaign.type) || { usage_count: 0, total_discount: 0 }
        typeMap.set(campaign.type, {
          usage_count: existing.usage_count + data._count,
          total_discount: existing.total_discount + (data._sum.discountAmount || 0)
        })
      }
    })

    const campaignTypeBreakdown = Array.from(typeMap.entries()).map(([type, data]) => ({
      type,
      ...data
    }))

    // Get top campaigns by usage
    const topCampaigns = await prisma.campaignUsage.groupBy({
      by: ['campaignId'],
      where,
      _count: true,
      _sum: {
        discountAmount: true,
        orderAmount: true
      },
      orderBy: {
        _count: {
          campaignId: 'desc'
        }
      },
      take: 5
    })

    // Get campaign details for top campaigns
    const topCampaignDetails = await Promise.all(
      topCampaigns.map(async (tc) => {
        const campaign = await prisma.campaign.findUnique({
          where: { id: tc.campaignId },
          select: {
            id: true,
            name: true,
            type: true
          }
        })
        return {
          ...campaign,
          usageCount: tc._count,
          totalDiscount: tc._sum.discountAmount || 0,
          totalOrderAmount: tc._sum.orderAmount || 0
        }
      })
    )

    // Get top customers by campaign usage
    const topCustomers = await prisma.campaignUsage.groupBy({
      by: ['customerId'],
      where,
      _count: true,
      _sum: {
        discountAmount: true,
        orderAmount: true
      },
      orderBy: {
        _sum: {
          discountAmount: 'desc'
        }
      },
      take: 5
    })

    // Get customer details for top customers
    const topCustomerDetails = await Promise.all(
      topCustomers.map(async (tc) => {
        const customer = await prisma.customer.findUnique({
          where: { id: tc.customerId },
          select: {
            id: true,
            name: true,
            email: true,
            tier: {
              select: {
                displayName: true,
                color: true
              }
            }
          }
        })
        return {
          ...customer,
          usageCount: tc._count,
          totalDiscount: tc._sum.discountAmount || 0,
          totalOrderAmount: tc._sum.orderAmount || 0
        }
      })
    )

    // Format response
    const response = {
      usages: usages.map(usage => ({
        id: usage.id,
        usedAt: usage.usedAt,
        orderAmount: usage.orderAmount,
        discountAmount: usage.discountAmount,
        campaign: {
          id: usage.campaign.id,
          name: usage.campaign.name,
          type: usage.campaign.type,
          discountType: usage.campaign.discountType,
          discountValue: usage.campaign.discountValue
        },
        customer: {
          id: usage.customer.id,
          name: usage.customer.name,
          email: usage.customer.email,
          phone: usage.customer.phone,
          tier: usage.customer.tier
        }
      })),
      summary: {
        totalUsages: total,
        totalOrderAmount: summary._sum.orderAmount || 0,
        totalDiscountGiven: summary._sum.discountAmount || 0,
        averageDiscount: total > 0 ? (summary._sum.discountAmount || 0) / total : 0,
        uniqueCampaigns: uniqueCampaigns.length,
        uniqueCustomers: uniqueCustomers.length,
        campaignTypeBreakdown,
        topCampaigns: topCampaignDetails,
        topCustomers: topCustomerDetails
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching campaign usage:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}