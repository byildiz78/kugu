/**
 * Database-based Mobile Authentication
 * Uses database instead of in-memory storage for OTP
 */

import { PrismaClient } from '@prisma/client'
import { sendOTP, validatePhoneNumber } from '@/lib/sms'
import { SignJWT, jwtVerify } from 'jose'

const prisma = new PrismaClient()
const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret')

// Default restaurant ID
let DEFAULT_RESTAURANT_ID: string | null = null

export interface MobileAuthSession {
  customerId: string
  phone: string
  issuedAt: number
  expiresAt: number
}

/**
 * Send OTP to phone number (Database version)
 */
export async function requestOTPDB(phone: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('requestOTPDB called with phone:', phone)
    
    // Validate phone number
    const validation = validatePhoneNumber(phone)
    console.log('Phone validation result:', validation)
    
    if (!validation.isValid) {
      return { success: false, error: validation.error }
    }

    const cleanPhone = validation.cleaned!
    console.log('Clean phone:', cleanPhone)
    
    // Rate limiting - check recent OTP requests
    const recentOTP = await prisma.oTPVerification.findFirst({
      where: {
        phone: cleanPhone,
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (recentOTP && recentOTP.attempts >= 3) {
      return { 
        success: false, 
        error: 'Çok fazla deneme. 5 dakika sonra tekrar deneyin.' 
      }
    }

    // Send OTP via SMS
    console.log('Sending OTP to:', `+90${cleanPhone}`)
    const smsResult = await sendOTP(`+90${cleanPhone}`)
    console.log('SMS result:', smsResult)
    
    if (!smsResult.success) {
      return { success: false, error: 'SMS gönderilemedi. Lütfen tekrar deneyin.' }
    }

    // Store OTP in database
    const expires = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    
    // Delete any existing OTP for this phone
    await prisma.oTPVerification.deleteMany({
      where: { phone: cleanPhone }
    })

    // Create new OTP record
    await prisma.oTPVerification.create({
      data: {
        phone: cleanPhone,
        otp: smsResult.otp!,
        expiresAt: expires,
        attempts: (recentOTP?.attempts || 0) + 1
      }
    })

    console.log(`OTP sent to ${cleanPhone}: ${smsResult.otp}`) // Remove in production

    return { success: true }
  } catch (error) {
    console.error('OTP request error:', error)
    return { success: false, error: 'Sistem hatası' }
  }
}

/**
 * Verify OTP and create session (Database version)
 */
export async function verifyOTPDB(phone: string, otp: string): Promise<{
  success: boolean
  token?: string
  customer?: any
  isNewCustomer?: boolean
  error?: string
}> {
  try {
    console.log('verifyOTPDB called with:', { phone, otp })
    
    const validation = validatePhoneNumber(phone)
    if (!validation.isValid) {
      return { success: false, error: validation.error }
    }

    const cleanPhone = validation.cleaned!
    console.log('Clean phone for verification:', cleanPhone)
    
    // Find OTP in database
    const otpRecord = await prisma.oTPVerification.findFirst({
      where: { 
        phone: cleanPhone,
        otp: otp,
        expiresAt: {
          gt: new Date() // Not expired
        }
      }
    })

    console.log('OTP record found:', !!otpRecord)
    
    if (!otpRecord) {
      return { success: false, error: 'Geçersiz veya süresi dolmuş kod.' }
    }

    // OTP verified, delete from database
    await prisma.oTPVerification.deleteMany({
      where: { phone: cleanPhone }
    })

    // Find or create customer
    let customer = await prisma.customer.findFirst({
      where: { phone: cleanPhone },
      include: {
        tier: true,
        restaurant: {
          select: { name: true }
        }
      }
    })

    let isNewCustomer = false

    if (!customer) {
      // Get default restaurant
      if (!DEFAULT_RESTAURANT_ID) {
        const defaultRestaurant = await prisma.restaurant.findFirst()
        if (!defaultRestaurant) {
          return { success: false, error: 'Sistem yapılandırması eksik' }
        }
        DEFAULT_RESTAURANT_ID = defaultRestaurant.id
      }

      // Create new customer
      customer = await prisma.customer.create({
        data: {
          phone: cleanPhone,
          name: '', // Will be filled during registration
          email: `temp_${cleanPhone}_${Date.now()}@temp.local`, // Temporary unique email
          restaurantId: DEFAULT_RESTAURANT_ID,
          points: 0,
          level: 'REGULAR',
          totalSpent: 0,
          visitCount: 0
        },
        include: {
          tier: true,
          restaurant: {
            select: { name: true }
          }
        }
      })

      isNewCustomer = true
      console.log('Created new customer:', customer.id)
    }

    // Create JWT token
    const session: MobileAuthSession = {
      customerId: customer.id,
      phone: cleanPhone,
      issuedAt: Date.now(),
      expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
    }

    const token = await new SignJWT(session as unknown as Record<string, unknown>)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(JWT_SECRET)

    console.log('Authentication successful for customer:', customer.id)

    return {
      success: true,
      token,
      customer,
      isNewCustomer
    }
  } catch (error) {
    console.error('OTP verification error:', error)
    return { success: false, error: 'Sistem hatası' }
  }
}

/**
 * Verify mobile auth token
 */
export async function verifyMobileToken(token: string): Promise<{
  success: boolean
  session?: MobileAuthSession
  error?: string
}> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return {
      success: true,
      session: payload as unknown as MobileAuthSession
    }
  } catch (error) {
    return {
      success: false,
      error: 'Invalid token'
    }
  }
}