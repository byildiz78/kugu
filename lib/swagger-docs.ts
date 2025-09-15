/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Get all customers
 *     description: Retrieve a paginated list of customers
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [REGULAR, BRONZE, SILVER, GOLD, PLATINUM]
 *         description: Filter by customer level
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 customers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Customer'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create a new customer
 *     description: Create a new customer account
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - restaurantId
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               phone:
 *                 type: string
 *                 example: "+90 555 123 45 67"
 *               birthDate:
 *                 type: string
 *                 format: date
 *                 example: "1990-01-01"
 *               restaurantId:
 *                 type: string
 *                 example: "rest123"
 *     responses:
 *       201:
 *         description: Customer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /api/customers/{id}:
 *   get:
 *     summary: Get customer by ID
 *     description: Retrieve detailed customer information including stats and available campaigns
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *         example: "cmdpkfcyp00029ohl4rtd974k"
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 customer:
 *                   $ref: '#/components/schemas/Customer'
 *                 availableCampaigns:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Campaign'
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalSpent:
 *                       type: number
 *                     totalVisits:
 *                       type: number
 *                     averageSpent:
 *                       type: number
 *                     currentPoints:
 *                       type: number
 *                     totalPointsEarned:
 *                       type: number
 *                     totalPointsSpent:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update customer
 *     description: Update customer information
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               birthDate:
 *                 type: string
 *                 format: date
 *               points:
 *                 type: number
 *               level:
 *                 type: string
 *                 enum: [REGULAR, BRONZE, SILVER, GOLD, PLATINUM]
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete customer
 *     description: Delete a customer account
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Customer deleted successfully"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /api/transactions:
 *   get:
 *     summary: Get all transactions
 *     description: Retrieve a paginated list of transactions
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         description: Filter by customer ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by order number or customer name/email
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by transaction status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions until this date
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create a new transaction
 *     description: Create a new transaction and process rewards/points
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - orderNumber
 *               - totalAmount
 *               - finalAmount
 *               - items
 *             properties:
 *               customerId:
 *                 type: string
 *                 example: "customer123"
 *               orderNumber:
 *                 type: string
 *                 example: "ORD-001"
 *               totalAmount:
 *                 type: number
 *                 minimum: 0
 *                 example: 100
 *               discountAmount:
 *                 type: number
 *                 default: 0
 *                 example: 10
 *               finalAmount:
 *                 type: number
 *                 minimum: 0
 *                 example: 90
 *               pointsUsed:
 *                 type: number
 *                 default: 0
 *                 example: 0
 *               paymentMethod:
 *                 type: string
 *                 example: "CARD"
 *               notes:
 *                 type: string
 *                 example: "Special order"
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/TransactionItem'
 *               appliedCampaigns:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     campaignId:
 *                       type: string
 *                     discountAmount:
 *                       type: number
 *                     freeItems:
 *                       type: array
 *                       items:
 *                         type: string
 *                     pointsEarned:
 *                       type: number
 *                       default: 0
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /api/campaigns:
 *   get:
 *     summary: Get all campaigns
 *     description: Retrieve a paginated list of campaigns
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or description
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by campaign type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by campaign status
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 campaigns:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Campaign'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create a new campaign
 *     description: Create a new marketing campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - type
 *               - startDate
 *               - endDate
 *               - discountType
 *               - discountValue
 *               - restaurantId
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 example: "Weekend Special"
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 example: "Special discount for weekend orders"
 *               type:
 *                 type: string
 *                 enum: [DISCOUNT, PRODUCT_BASED, LOYALTY_POINTS, TIME_BASED, BIRTHDAY_SPECIAL, COMBO_DEAL, BUY_X_GET_Y, CATEGORY_DISCOUNT, REWARD_CAMPAIGN]
 *                 example: "DISCOUNT"
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-01T00:00:00Z"
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-12-31T23:59:59Z"
 *               discountType:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED_AMOUNT, FREE_ITEM, BUY_ONE_GET_ONE]
 *                 example: "PERCENTAGE"
 *               discountValue:
 *                 type: number
 *                 minimum: 0
 *                 example: 20
 *               minPurchase:
 *                 type: number
 *                 minimum: 0
 *                 example: 100
 *               maxUsage:
 *                 type: number
 *                 minimum: 1
 *                 example: 1000
 *               maxUsagePerCustomer:
 *                 type: number
 *                 minimum: 1
 *                 default: 1
 *                 example: 1
 *               restaurantId:
 *                 type: string
 *                 example: "rest123"
 *               segmentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["segment1", "segment2"]
 *     responses:
 *       201:
 *         description: Campaign created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Campaign'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */