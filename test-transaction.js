// Test script to get customer and product IDs
const { PrismaClient } = require('@prisma/client')

async function getTestData() {
  const prisma = new PrismaClient()
  
  try {
    // Get customers
    const customers = await prisma.customer.findMany({
      include: { tier: true },
      take: 3
    })
    
    // Get products  
    const products = await prisma.product.findMany({
      take: 3
    })
    
    console.log('=== CUSTOMERS ===')
    customers.forEach(c => {
      console.log(`${c.name} (${c.email}) - ID: ${c.id} - Tier: ${c.tier?.displayName || 'None'}`)
    })
    
    console.log('\n=== PRODUCTS ===')
    products.forEach(p => {
      console.log(`${p.name} - ID: ${p.id} - Price: ${p.price}₺`)
    })

    // Generate test curl
    const customer = customers[0]  
    const product = products[0]
    
    console.log('\n=== TEST CURL ===')
    console.log(`curl -X POST http://localhost:3000/api/transactions \\
  -H "Content-Type: application/json" \\
  -d '{
    "customerId": "${customer.id}",
    "orderNumber": "TEST-${Date.now()}",
    "totalAmount": 100,
    "discountAmount": 0,
    "finalAmount": 100,
    "pointsUsed": 0,
    "paymentMethod": "CARD",
    "items": [{
      "productId": "${product.id}",
      "productName": "${product.name}",
      "category": "${product.category}",
      "quantity": 1,
      "unitPrice": ${product.price},
      "totalPrice": ${product.price}
    }]
  }'`)

  } finally {
    await prisma.$disconnect()
  }
}

getTestData().catch(console.error)