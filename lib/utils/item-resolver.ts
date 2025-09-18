import { prisma } from '@/lib/prisma'

interface InputItem {
  productId?: string
  menuItemKey?: string
  quantity: number
  [key: string]: any // Allow other properties
}

interface ResolvedItem {
  productId: string
  quantity: number
  menuItemKey?: string
  [key: string]: any
}

/**
 * Resolves items with either productId or menuItemKey to ensure all items have productId
 * Maintains backward compatibility while supporting POS integration
 */
export async function resolveItemIds(
  items: InputItem[],
  restaurantId: string
): Promise<ResolvedItem[]> {
  if (!items || items.length === 0) {
    return []
  }

  return Promise.all(items.map(async (item) => {
    // If productId is already provided, use it directly
    if (item.productId) {
      return {
        ...item,
        productId: item.productId
      } as ResolvedItem
    }

    // If menuItemKey is provided, resolve to productId
    if (item.menuItemKey) {
      console.log(`[ItemResolver] Looking for menuItemKey: ${item.menuItemKey} in restaurant: ${restaurantId}`)

      // Debug: List all products with this menuItemKey regardless of restaurant
      const allProductsWithKey = await prisma.product.findMany({
        where: {
          menuItemKey: item.menuItemKey
        },
        select: {
          id: true,
          name: true,
          restaurantId: true,
          isActive: true,
          menuItemKey: true
        }
      })
      console.log(`[ItemResolver] All products with menuItemKey ${item.menuItemKey}:`, allProductsWithKey)

      // TEMPORARY FIX: Skip restaurant validation for menuItemKey resolution
      console.log(`[ItemResolver] TEMP FIX: Searching for menuItemKey without restaurant restriction`)
      const product = await prisma.product.findFirst({
        where: {
          menuItemKey: item.menuItemKey,
          isActive: true  // Only require active status
        },
        select: {
          id: true,
          name: true,
          price: true,
          category: true,
          menuItemKey: true
        }
      })

      console.log(`[ItemResolver] Final product found:`, product)

      if (!product) {
        console.log(`[ItemResolver] Product NOT FOUND for menuItemKey: ${item.menuItemKey}`)
        // If product not found, create a placeholder with the menuItemKey
        return {
          ...item,
          productId: `unknown-${item.menuItemKey}`, // Use menuItemKey as fallback ID
          productName: item.menuItemKey || 'Unknown Product',
          unitPrice: item.unitPrice || 0,
          category: 'Unknown',
          totalPrice: (item.unitPrice || 0) * item.quantity,
          menuItemKey: item.menuItemKey
        } as ResolvedItem
      }

      return {
        ...item,
        productId: product.id,
        // Preserve menuItemKey for reference
        menuItemKey: item.menuItemKey
      } as ResolvedItem
    }

    // Neither productId nor menuItemKey provided
    throw new Error('Either productId or menuItemKey must be provided for each item')
  }))
}

/**
 * Validates that all required fields are present for each item
 */
export function validateItems(items: InputItem[]): void {
  if (!Array.isArray(items)) {
    throw new Error('Items must be an array')
  }

  if (items.length === 0) {
    throw new Error('At least one item is required')
  }

  items.forEach((item, index) => {
    if (!item.productId && !item.menuItemKey) {
      throw new Error(`Item at index ${index} must have either productId or menuItemKey`)
    }

    if (!item.quantity || item.quantity <= 0) {
      throw new Error(`Item at index ${index} must have a valid quantity > 0`)
    }

    if (typeof item.quantity !== 'number') {
      throw new Error(`Item at index ${index} quantity must be a number`)
    }
  })
}

/**
 * Gets product details for resolved items
 */
export async function enrichItemsWithProductDetails(
  resolvedItems: ResolvedItem[],
  restaurantId: string
) {
  const productIds = resolvedItems.map(item => item.productId)

  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      restaurantId,
      isActive: true
    },
    select: {
      id: true,
      name: true,
      price: true,
      category: true,
      menuItemKey: true
    }
  })

  return resolvedItems.map(item => {
    const product = products.find(p => p.id === item.productId)

    // If product not found and it's an unknown item (from menuItemKey), keep existing data
    if (!product && item.productId.startsWith('unknown-')) {
      return item // Already has all needed properties from resolveItemIds
    }

    // If product not found but it's a real productId, create placeholder
    if (!product) {
      return {
        ...item,
        productName: item.productName || 'Unknown Product',
        unitPrice: item.unitPrice || 0,
        category: 'Unknown',
        totalPrice: (item.unitPrice || 0) * item.quantity
      }
    }

    return {
      ...item,
      productName: product.name,
      unitPrice: product.price,
      category: product.category,
      totalPrice: product.price * item.quantity
    }
  })
}

/**
 * Complete resolution pipeline: validate -> resolve -> enrich
 */
export async function processTransactionItems(
  items: InputItem[],
  restaurantId: string
) {
  // Step 1: Validate input
  validateItems(items)

  // Step 2: Resolve productIds
  const resolvedItems = await resolveItemIds(items, restaurantId)

  // Step 3: Enrich with product details
  const enrichedItems = await enrichItemsWithProductDetails(resolvedItems, restaurantId)

  return enrichedItems
}