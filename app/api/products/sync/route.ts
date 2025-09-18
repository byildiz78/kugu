import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface POSProduct {
  MenuItemkey: string
  ProductName: string
  CategoryName: string
  Description?: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Giriş yapmanız gerekiyor'
      }, { status: 401 })
    }

    // Get restaurant ID from user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { restaurantId: true, role: true }
    })

    if (!user?.restaurantId) {
      return NextResponse.json({
        error: 'No restaurant found',
        message: 'Kullanıcıya ait restoran bulunamadı'
      }, { status: 400 })
    }

    // Check if user has permission
    if (!['ADMIN', 'RESTAURANT_ADMIN'].includes(user.role)) {
      return NextResponse.json({
        error: 'Insufficient permissions',
        message: 'Bu işlem için yetkiniz bulunmuyor'
      }, { status: 403 })
    }

    // Get POS settings
    const settings = await prisma.settings.findUnique({
      where: { restaurantId: user.restaurantId },
      select: {
        menuItemsBearerToken: true,
        menuItemsQuery: true
      }
    })

    if (!settings?.menuItemsBearerToken || !settings?.menuItemsQuery) {
      return NextResponse.json({
        error: 'POS settings not configured',
        message: 'POS API ayarları yapılandırılmamış. Lütfen ayarlar sayfasından Bearer Token ve Query bilgilerini girin.'
      }, { status: 400 })
    }

    // Parse the query from settings (it should be a JSON string)
    console.log('Raw menuItemsQuery from settings:', settings.menuItemsQuery)
    console.log('Type:', typeof settings.menuItemsQuery)

    // Clean up the JSON string - remove newlines and extra spaces
    const cleanedQuery = settings.menuItemsQuery
      .replace(/\n/g, ' ')
      .replace(/\r/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    console.log('Cleaned query:', cleanedQuery)

    let queryObject
    try {
      queryObject = JSON.parse(cleanedQuery)
    } catch (error) {
      console.error('JSON parse error:', error)
      console.error('Cleaned string:', JSON.stringify(cleanedQuery))
      return NextResponse.json({
        error: 'Invalid query format',
        message: `API sorgusu geçerli JSON formatında değil: ${error.message}`
      }, { status: 400 })
    }

    console.log('POS API Request:')
    console.log('URL: https://pos-integration.robotpos.com/realtimeapi/api/query')
    console.log('Headers:', {
      'Authorization': `Bearer ${settings.menuItemsBearerToken.substring(0, 10)}...`,
      'Content-Type': 'application/json'
    })
    console.log('Body:', JSON.stringify(queryObject, null, 2))

    // Make request to POS API
    const posResponse = await fetch('https://pos-integration.robotpos.com/realtimeapi/api/query', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.menuItemsBearerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(queryObject)
    })

    if (!posResponse.ok) {
      const errorText = await posResponse.text()
      return NextResponse.json({
        error: 'POS API error',
        message: `POS API hatası: ${posResponse.status} - ${errorText}`
      }, { status: 500 })
    }

    const posData = await posResponse.json()
    console.log('POS API Response:', JSON.stringify(posData, null, 2))

    // Check if response has the expected structure
    if (!posData.data || !Array.isArray(posData.data)) {
      return NextResponse.json({
        error: 'Invalid POS response',
        message: 'POS API\'den beklenmeyen veri formatı alındı. "data" array\'i bulunamadı.'
      }, { status: 500 })
    }

    const products: POSProduct[] = posData.data

    let updatedCount = 0
    let insertedCount = 0
    let errors: string[] = []

    // Process each product
    for (const posProduct of products) {
      try {
        if (!posProduct.MenuItemkey || !posProduct.ProductName || !posProduct.CategoryName) {
          errors.push(`Eksik veri: ${JSON.stringify(posProduct)}`)
          continue
        }

        // Check if product exists with this menuItemKey
        const existingProduct = await prisma.product.findFirst({
          where: {
            menuItemKey: posProduct.MenuItemkey,
            restaurantId: user.restaurantId
          }
        })

        const productData = {
          name: posProduct.ProductName,
          category: posProduct.CategoryName,
          price: 0, // POS'tan fiyat bilgisi gelmediği için 0 olarak set et
          description: posProduct.Description || null,
          menuItemKey: posProduct.MenuItemkey,
          restaurantId: user.restaurantId,
          isActive: true
        }

        if (existingProduct) {
          // Update existing product
          await prisma.product.update({
            where: { id: existingProduct.id },
            data: {
              name: productData.name,
              category: productData.category,
              price: productData.price,
              description: productData.description,
              updatedAt: new Date()
            }
          })
          updatedCount++
        } else {
          // Insert new product
          await prisma.product.create({
            data: productData
          })
          insertedCount++
        }
      } catch (error) {
        console.error('Error processing product:', posProduct, error)
        errors.push(`Ürün işleme hatası (${posProduct.MenuItemkey}): ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Ürün senkronizasyonu tamamlandı',
      summary: {
        totalReceived: products.length,
        inserted: insertedCount,
        updated: updatedCount,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Error syncing products:', error)
    return NextResponse.json({
      error: 'Sync failed',
      message: error instanceof Error ? error.message : 'Senkronizasyon sırasında bilinmeyen hata oluştu'
    }, { status: 500 })
  }
}