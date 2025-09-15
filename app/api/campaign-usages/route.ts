import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const campaignType = searchParams.get('campaignType') || ''
    const dateFilter = searchParams.get('dateFilter') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      AND: []
    }

    // Search filter
    if (search) {
      where.AND.push({
        OR: [
          { campaign: { name: { contains: search, mode: 'insensitive' } } },
          { customer: { name: { contains: search, mode: 'insensitive' } } },
          { customer: { email: { contains: search, mode: 'insensitive' } } }
        ]
      })
    }

    // Campaign type filter
    if (campaignType && campaignType !== 'ALL') {
      where.AND.push({
        campaign: { type: campaignType }
      })
    }

    // Date filter
    if (dateFilter && dateFilter !== 'ALL') {
      const now = new Date()
      let startDate: Date

      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3)
          startDate = new Date(now.getFullYear(), quarter * 3, 1)
          break
        default:
          startDate = new Date(0)
      }

      where.AND.push({
        usedAt: { gte: startDate }
      })
    }

    // Build separate where clauses for each table
    const campaignUsageWhere = { ...where }
    
    // For TransactionCampaign, we need to adjust the where clause structure
    const transactionCampaignWhere: any = { AND: [] }
    
    // Search filter for TransactionCampaign
    if (search) {
      transactionCampaignWhere.AND.push({
        OR: [
          { campaign: { name: { contains: search, mode: 'insensitive' } } },
          { transaction: { customer: { name: { contains: search, mode: 'insensitive' } } } },
          { transaction: { customer: { email: { contains: search, mode: 'insensitive' } } } }
        ]
      })
    }

    // Campaign type filter for TransactionCampaign
    if (campaignType && campaignType !== 'ALL') {
      transactionCampaignWhere.AND.push({
        campaign: { type: campaignType }
      })
    }

    // Date filter for TransactionCampaign
    if (dateFilter && dateFilter !== 'ALL') {
      const now = new Date()
      let startDate: Date

      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3)
          startDate = new Date(now.getFullYear(), quarter * 3, 1)
          break
        default:
          startDate = new Date(0)
      }

      transactionCampaignWhere.AND.push({
        appliedAt: { gte: startDate }
      })
    }

    // Get campaign usages from both CampaignUsage and TransactionCampaign tables
    const [campaignUsages, transactionCampaigns] = await Promise.all([
      prisma.campaignUsage.findMany({
        where: campaignUsageWhere,
        include: {
          campaign: {
            select: {
              name: true,
              type: true
            }
          },
          customer: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: { usedAt: 'desc' }
      }),
      prisma.transactionCampaign.findMany({
        where: transactionCampaignWhere,
        include: {
          campaign: {
            select: {
              name: true,
              type: true
            }
          },
          transaction: {
            select: {
              customerId: true,
              totalAmount: true,
              customer: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: { appliedAt: 'desc' }
      })
    ])

    // Combine and transform the data
    const combinedUsages = [
      // CampaignUsage records
      ...campaignUsages.map(usage => ({
        id: usage.id,
        campaignId: usage.campaignId,
        customerId: usage.customerId,
        usedAt: usage.usedAt.toISOString(),
        orderAmount: usage.orderAmount,
        discountAmount: usage.discountAmount,
        campaign: usage.campaign,
        customer: usage.customer
      })),
      // TransactionCampaign records
      ...transactionCampaigns.map(tc => ({
        id: tc.id,
        campaignId: tc.campaignId,
        customerId: tc.transaction.customerId,
        usedAt: tc.appliedAt.toISOString(),
        orderAmount: tc.transaction.totalAmount,
        discountAmount: tc.discountAmount,
        campaign: tc.campaign,
        customer: tc.transaction.customer
      }))
    ]

    // Sort by usedAt desc
    combinedUsages.sort((a, b) => new Date(b.usedAt).getTime() - new Date(a.usedAt).getTime())

    // Apply pagination
    const startIndex = skip
    const endIndex = skip + limit
    const usages = combinedUsages.slice(startIndex, endIndex)
    const total = combinedUsages.length

    // Calculate statistics from combined data
    const stats = {
      totalUsages: combinedUsages.length,
      totalSavings: combinedUsages.reduce((sum, usage) => sum + usage.discountAmount, 0),
      totalOrderValue: combinedUsages.reduce((sum, usage) => sum + usage.orderAmount, 0),
      averageDiscount: combinedUsages.length > 0 
        ? combinedUsages.reduce((sum, usage) => sum + (usage.discountAmount / usage.orderAmount * 100), 0) / combinedUsages.length
        : 0,
      uniqueCustomers: new Set(combinedUsages.map(usage => usage.customerId)).size,
      topCampaign: getTopCampaign(combinedUsages)
    }

    return NextResponse.json({
      usages,
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching campaign usages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getTopCampaign(usages: any[]): string | null {
  if (usages.length === 0) return null

  // Count campaign usage frequency
  const campaignCounts = usages.reduce((acc, usage) => {
    const campaignName = usage.campaign.name
    acc[campaignName] = (acc[campaignName] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Find the most used campaign
  const topCampaign = Object.entries(campaignCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0]

  return topCampaign ? topCampaign[0] : null
}