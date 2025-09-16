/**
 * Netgsm SMS Service
 * SMS sending and OTP management for mobile authentication
 */

interface SMSMessage {
  msg: string
  no: string // Phone number without +90
}

interface SMSResponse {
  success: boolean
  message?: string
  error?: string
}

/**
 * Send SMS via Netgsm API
 */
export async function sendSMS(phoneNumber: string, message: string): Promise<SMSResponse> {
  try {
    console.log('sendSMS called with:', { phoneNumber, message })
    
    // Clean phone number (remove +90, spaces, etc.)
    const cleanNumber = phoneNumber.replace(/^\+?90/, '').replace(/\s/g, '')
    console.log('Cleaned number:', cleanNumber)
    
    const payload = {
      msgheader: process.env.SMS_MSG_HEADER || "RobotPOS",
      startdate: "",
      stopdate: "",
      appname: process.env.SMS_APP_NAME || "robotPOS", 
      iysfilter: "0",
      encoding: "TR",
      messages: [
        {
          msg: message,
          no: cleanNumber
        }
      ]
    }
    
    console.log('SMS payload:', payload)
    console.log('SMS API URL:', process.env.SMS_API_URL)
    console.log('SMS Auth Token exists:', !!process.env.SMS_AUTH_TOKEN)

    const response = await fetch(process.env.SMS_API_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${process.env.SMS_AUTH_TOKEN}`
      },
      body: JSON.stringify(payload)
    })

    console.log('SMS API response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('SMS API error response:', errorText)
      throw new Error(`SMS API error: ${response.status} - ${errorText}`)
    }

    const result = await response.text()
    console.log('SMS API result:', result)
    
    // Try to parse as JSON first, fallback to text
    let parsedResult: any
    try {
      parsedResult = JSON.parse(result)
      console.log('Parsed SMS result:', parsedResult)
      
      // Check if it's JSON response with code field
      if (parsedResult.code === '00') {
        return {
          success: true,
          message: 'SMS sent successfully'
        }
      } else {
        return {
          success: false,
          error: `SMS error: ${parsedResult.description || parsedResult.code || result}`
        }
      }
    } catch (parseError) {
      // Fallback to text parsing for backward compatibility
      console.log('Parsing as text (non-JSON response)')
      
      // Netgsm returns numeric codes
      // 00 = Success, other codes = error
      if (result.startsWith('00')) {
        return {
          success: true,
          message: 'SMS sent successfully'
        }
      } else {
        return {
          success: false,
          error: `SMS error code: ${result}`
        }
      }
    }
    
  } catch (error) {
    console.error('SMS sending error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Generate 4-digit OTP code
 */
export function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

/**
 * Send OTP SMS to phone number
 */
export async function sendOTP(phoneNumber: string): Promise<{ success: boolean; otp?: string; error?: string }> {
  const otp = generateOTP()
  const message = `Air CRM doğrulama kodunuz: ${otp}`
  
  const result = await sendSMS(phoneNumber, message)
  
  if (result.success) {
    return {
      success: true,
      otp // Return for development/testing, remove in production
    }
  } else {
    return {
      success: false,
      error: result.error
    }
  }
}

/**
 * Validate Turkish phone number format
 */
export function validatePhoneNumber(phone: string): { isValid: boolean; cleaned?: string; error?: string } {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')
  
  // Check for Turkish mobile number patterns
  // Valid formats: 5XXXXXXXXX (10 digits) or 905XXXXXXXXX (12 digits)
  if (digits.length === 10 && digits.startsWith('5')) {
    return {
      isValid: true,
      cleaned: digits
    }
  } else if (digits.length === 12 && digits.startsWith('905')) {
    return {
      isValid: true,
      cleaned: digits.substring(2) // Remove 90 prefix
    }
  } else {
    return {
      isValid: false,
      error: 'Geçerli bir Türkiye telefon numarası giriniz (5XXXXXXXXX)'
    }
  }
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `+90 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6, 8)} ${cleaned.substring(8)}`
  }
  return phone
}