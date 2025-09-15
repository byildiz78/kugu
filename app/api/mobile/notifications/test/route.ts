import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth-utils'
import { z } from 'zod'

const testNotificationSchema = z.object({
  customerId: z.string(),
  type: z.enum(['CAMPAIGN', 'REWARD', 'POINTS', 'GENERAL']).default('GENERAL')
})

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'Valid session or Bearer token required' 
      }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = testNotificationSchema.parse(body)

    // Generate test notification content based on type
    let title = 'Air CRM Test'
    let notificationBody = 'Bu bir test bildirimidir'
    let data: any = { type: validatedData.type }

    switch (validatedData.type) {
      case 'CAMPAIGN':
        title = '🎉 Yeni Kampanya!'
        notificationBody = 'Size özel bir kampanya hazırladık. Hemen görüntüleyin!'
        data.campaignId = 'demo-campaign'
        data.url = '/mobile/campaigns'
        break
      case 'REWARD':
        title = '🎁 Ödül Kazandınız!'
        notificationBody = 'Puanlarınızla yeni ödüller kazanabilirsiniz!'
        data.rewardId = 'demo-reward'
        data.url = '/mobile/rewards'
        break
      case 'POINTS':
        title = '⭐ Puan Güncellemesi'
        notificationBody = 'Puan bakiyenizde değişiklik oldu!'
        data.url = '/mobile/profile'
        break
      default:
        title = '📱 Air CRM'
        notificationBody = 'Uygulamayı ziyaret etmeyi unutmayın!'
        data.url = '/mobile/dashboard'
    }

    // Send notification using the send endpoint
    const baseUrl = request.url.replace('/test', '')
    const sendUrl = `${baseUrl}/send`
    
    console.log('Test notification - sending to:', sendUrl)
    
    const sendResponse = await fetch(sendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || ''
      },
      body: JSON.stringify({
        customerId: validatedData.customerId,
        title,
        body: notificationBody,
        data
      })
    })

    console.log('Send response status:', sendResponse.status)
    console.log('Send response headers:', Object.fromEntries(sendResponse.headers.entries()))

    if (!sendResponse.ok) {
      const errorText = await sendResponse.text()
      console.error('Send endpoint error:', errorText)
      return NextResponse.json({ 
        error: 'Failed to send notification',
        details: errorText,
        status: sendResponse.status
      }, { status: 500 })
    }

    const sendResult = await sendResponse.json()

    return NextResponse.json({
      message: 'Test notification sent successfully',
      type: validatedData.type,
      ...sendResult
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error sending test notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}