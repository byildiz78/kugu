import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Air CRM API',
      version: '1.0.0',
      description: 'Air CRM API Documentation with Bearer Token Authentication',
      contact: {
        name: 'Air CRM Team',
        url: 'https://example.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your Bearer Token (air-crm-api-v1-secure-token-...)',
        },
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'next-auth.session-token',
          description: 'NextAuth session cookie',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            message: {
              type: 'string',
              description: 'Detailed error message',
            },
          },
        },
        Customer: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Customer ID',
            },
            name: {
              type: 'string',
              description: 'Customer name',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Customer email',
            },
            phone: {
              type: 'string',
              description: 'Customer phone',
              nullable: true,
            },
            points: {
              type: 'number',
              description: 'Current loyalty points',
            },
            level: {
              type: 'string',
              enum: ['REGULAR', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
              description: 'Customer level',
            },
            totalSpent: {
              type: 'number',
              description: 'Total amount spent',
            },
            visitCount: {
              type: 'number',
              description: 'Total visit count',
            },
            tier: {
              $ref: '#/components/schemas/Tier',
            },
          },
        },
        Tier: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            name: {
              type: 'string',
            },
            displayName: {
              type: 'string',
            },
            color: {
              type: 'string',
            },
            pointMultiplier: {
              type: 'number',
            },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            orderNumber: {
              type: 'string',
            },
            totalAmount: {
              type: 'number',
            },
            discountAmount: {
              type: 'number',
            },
            finalAmount: {
              type: 'number',
            },
            pointsEarned: {
              type: 'number',
            },
            pointsUsed: {
              type: 'number',
            },
            customerId: {
              type: 'string',
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/TransactionItem',
              },
            },
          },
        },
        TransactionItem: {
          type: 'object',
          properties: {
            productId: {
              type: 'string',
            },
            productName: {
              type: 'string',
            },
            category: {
              type: 'string',
              nullable: true,
            },
            quantity: {
              type: 'number',
              minimum: 1,
            },
            unitPrice: {
              type: 'number',
              minimum: 0,
            },
            totalPrice: {
              type: 'number',
              minimum: 0,
            },
            discountAmount: {
              type: 'number',
              default: 0,
            },
            isFree: {
              type: 'boolean',
              default: false,
            },
          },
          required: ['productId', 'productName', 'quantity', 'unitPrice', 'totalPrice'],
        },
        Campaign: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            name: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            type: {
              type: 'string',
              enum: ['DISCOUNT', 'PRODUCT_BASED', 'LOYALTY_POINTS', 'TIME_BASED', 'BIRTHDAY_SPECIAL', 'COMBO_DEAL', 'BUY_X_GET_Y', 'CATEGORY_DISCOUNT', 'REWARD_CAMPAIGN'],
            },
            isActive: {
              type: 'boolean',
            },
            startDate: {
              type: 'string',
              format: 'date-time',
            },
            endDate: {
              type: 'string',
              format: 'date-time',
            },
            discountType: {
              type: 'string',
              enum: ['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_ITEM', 'BUY_ONE_GET_ONE'],
            },
            discountValue: {
              type: 'number',
            },
            minPurchase: {
              type: 'number',
              nullable: true,
            },
            maxUsage: {
              type: 'number',
              nullable: true,
            },
            maxUsagePerCustomer: {
              type: 'number',
              default: 1,
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
      {
        sessionAuth: [],
      },
    ],
  },
  apis: ['./app/api/**/*.ts', './lib/swagger-docs.ts'],
}

const specs = swaggerJsdoc(options)
export default specs