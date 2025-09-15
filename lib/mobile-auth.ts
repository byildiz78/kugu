/**
 * Mobile Authentication Utilities
 * Handles SMS-based authentication for mobile users
 */

import { prisma } from '@/lib/prisma'
import { sendOTP, validatePhoneNumber } from '@/lib/sms'
import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret')

// OTP storage - in production use Redis or database
const otpStore = new Map<string, { otp: string; expires: Date; attempts: number }>()

// Default restaurant ID - in production, handle restaurant selection
let DEFAULT_RESTAURANT_ID: string | null = null

export interface MobileAuthSession {
  customerId: string
  phone: string
  issuedAt: number
  expiresAt: number
}

/**
 * Send OTP to phone number
 */
export async function requestOTP(phone: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('requestOTP called with phone:', phone)
    
    // Validate phone number
    const validation = validatePhoneNumber(phone)
    console.log('Phone validation result:', validation)
    
    if (!validation.isValid) {
      return { success: false, error: validation.error }
    }

    const cleanPhone = validation.cleaned!
    console.log('Clean phone:', cleanPhone)
    
    // Check if customer exists or create new one
    let customer = await prisma.customer.findFirst({
      where: { phone: cleanPhone }
    })

    // Rate limiting - max 3 attempts per phone per 5 minutes
    const existing = otpStore.get(cleanPhone)
    if (existing && existing.attempts >= 3 && existing.expires > new Date()) {
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

    // Store OTP with 5-minute expiry
    const expires = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    otpStore.set(cleanPhone, {
      otp: smsResult.otp!,
      expires,
      attempts: (existing?.attempts || 0) + 1
    })

    console.log(`OTP sent to ${cleanPhone}: ${smsResult.otp}`) // Remove in production

    return { success: true }
  } catch (error) {
    console.error('OTP request error:', error)
    return { success: false, error: 'Sistem hatası' }
  }
}

/**
 * Verify OTP and create session
 */
export async function verifyOTP(phone: string, otp: string): Promise<{
  success: boolean
  token?: string
  customer?: any
  isNewCustomer?: boolean
  error?: string
}> {
  try {
    console.log('verifyOTP called with:', { phone, otp })
    
    const validation = validatePhoneNumber(phone)
    if (!validation.isValid) {
      return { success: false, error: validation.error }
    }

    const cleanPhone = validation.cleaned!
    console.log('Clean phone for verification:', cleanPhone)
    
    // Debug: Check all stored OTPs
    console.log('Current OTP store keys:', Array.from(otpStore.keys()))
    console.log('OTP store size:', otpStore.size)
    
    // Check stored OTP
    const stored = otpStore.get(cleanPhone)
    console.log('Stored OTP data:', stored)
    
    if (!stored) {
      console.log('OTP not found for phone:', cleanPhone)
      return { success: false, error: 'OTP bulunamadı. Yeni kod talep edin.' }
    }

    if (stored.expires < new Date()) {
      otpStore.delete(cleanPhone)
      return { success: false, error: 'OTP süresi dolmuş. Yeni kod talep edin.' }
    }

    if (stored.otp !== otp) {
      return { success: false, error: 'Yanlış doğrulama kodu.' }
    }

    // OTP verified, clear from store
    otpStore.delete(cleanPhone)

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
      // Get default restaurant (first one) - in production, handle restaurant selection properly
      if (!DEFAULT_RESTAURANT_ID) {
        const defaultRestaurant = await prisma.restaurant.findFirst()
        if (!defaultRestaurant) {
          return { success: false, error: 'Sistem yapılandırması eksik' }
        }
        DEFAULT_RESTAURANT_ID = defaultRestaurant.id
      }

      // Create new customer - we'll complete registration later
      customer = await prisma.customer.create({
        data: {
          phone: cleanPhone,
          name: '', // Will be filled during registration
          email: '', // Will be filled during registration  
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
    }

    // Create long-lasting JWT token (30 days)
    const now = Math.floor(Date.now() / 1000)
    const expiresAt = now + (30 * 24 * 60 * 60) // 30 days

    const payload: MobileAuthSession = {
      customerId: customer.id,
      phone: cleanPhone,
      issuedAt: now,
      expiresAt
    }

    const token = await new SignJWT(payload as unknown as Record<string, unknown>)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(expiresAt)
      .sign(JWT_SECRET)

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
  valid: boolean
  session?: MobileAuthSession
  customer?: any
}> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const session = payload as unknown as MobileAuthSession

    // Check if token is expired
    if (session.expiresAt < Math.floor(Date.now() / 1000)) {
      return { valid: false }
    }

    // Get fresh customer data
    const customer = await prisma.customer.findUnique({
      where: { id: session.customerId },
      include: {
        tier: true,
        restaurant: {
          select: { name: true }
        }
      }
    })

    if (!customer) {
      return { valid: false }
    }

    return {
      valid: true,
      session,
      customer
    }

  } catch (error) {
    console.error('Token verification error:', error)
    return { valid: false }
  }
}

/**
 * Refresh mobile auth token (extend expiry)
 */
export async function refreshMobileToken(token: string): Promise<{ success: boolean; newToken?: string }> {
  try {
    const verification = await verifyMobileToken(token)
    if (!verification.valid || !verification.session) {
      return { success: false }
    }

    // Create new token with extended expiry
    const now = Math.floor(Date.now() / 1000)
    const expiresAt = now + (30 * 24 * 60 * 60) // 30 days

    const newPayload: MobileAuthSession = {
      ...verification.session,
      issuedAt: now,
      expiresAt
    }

    const newToken = await new SignJWT(newPayload as unknown as Record<string, unknown>)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(expiresAt)
      .sign(JWT_SECRET)

    return {
      success: true,
      newToken
    }

  } catch (error) {
    console.error('Token refresh error:', error)
    return { success: false }
  }
}

/**
 * Clear OTP attempts for testing
 */
export function clearOTPAttempts(phone: string): void {
  const validation = validatePhoneNumber(phone)
  if (validation.isValid) {
    otpStore.delete(validation.cleaned!)
  }
}