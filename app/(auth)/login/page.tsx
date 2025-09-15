'use client'

import { useState, useEffect } from 'react'
import { signIn, getCsrfToken } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Layout } from '@/components/ui/layout'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [csrfToken, setCsrfToken] = useState<string | undefined>()
  const router = useRouter()

  useEffect(() => {
    // Get CSRF token on mount
    getCsrfToken().then((token) => {
      console.log('CSRF Token received:', token ? 'Yes' : 'No')
      setCsrfToken(token)
    })

    // Check if user is already logged in
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        console.log('Session check on page load:', data)
        if (data?.user) {
          console.log('User already logged in, redirecting to /admin')
          // Force redirect if already logged in
          window.location.replace('/admin')
        }
      })
      .catch(err => console.error('Session check error:', err))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    console.log('=== DETAILED LOGIN DEBUG START ===')
    console.log('Timestamp:', new Date().toISOString())
    console.log('Email:', email)
    console.log('Password length:', password.length)
    console.log('Current URL:', window.location.href)
    console.log('Origin:', window.location.origin)
    console.log('Protocol:', window.location.protocol)
    console.log('Hostname:', window.location.hostname)
    console.log('Port:', window.location.port)
    console.log('CSRF Token:', csrfToken)
    console.log('Browser:', navigator.userAgent)

    // First, let's check what NextAuth endpoints return
    console.log('=== Testing NextAuth Endpoints ===')
    
    try {
      // Test providers endpoint
      const providersRes = await fetch('/api/auth/providers')
      console.log('Providers endpoint status:', providersRes.status)
      console.log('Providers headers:', Object.fromEntries(providersRes.headers.entries()))
      const providersText = await providersRes.text()
      console.log('Providers response (first 200 chars):', providersText.substring(0, 200))
      
      // Test session endpoint
      const sessionRes = await fetch('/api/auth/session')
      console.log('Session endpoint status:', sessionRes.status)
      const sessionText = await sessionRes.text()
      console.log('Session response:', sessionText)
      
      // Test CSRF endpoint
      const csrfRes = await fetch('/api/auth/csrf')
      console.log('CSRF endpoint status:', csrfRes.status)
      const csrfText = await csrfRes.text()
      console.log('CSRF response:', csrfText)
    } catch (testError) {
      console.error('Endpoint test error:', testError)
    }

    console.log('=== Attempting SignIn ===')
    
    try {
      // Try manual API call first
      console.log('Testing manual API call to /api/auth/callback/credentials')
      const manualRes = await fetch('/api/auth/callback/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          csrfToken: csrfToken || ''
        })
      })
      console.log('Manual API call status:', manualRes.status)
      console.log('Manual API call headers:', Object.fromEntries(manualRes.headers.entries()))
      const manualText = await manualRes.text()
      console.log('Manual API response (first 500 chars):', manualText.substring(0, 500))

      // Now try NextAuth signIn
      console.log('Calling NextAuth signIn...')
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/admin'
      })

      console.log('SignIn result:', JSON.stringify(result, null, 2))

      // Since server auth is working, let's check session after signIn attempt
      const sessionCheck = await fetch('/api/auth/session')
      const sessionData = await sessionCheck.json()
      console.log('Session after signIn attempt:', sessionData)

      if (sessionData?.user) {
        console.log('Login successful! Session exists:', sessionData.user)
        console.log('Redirecting to /admin...')
        // Try multiple redirect methods
        try {
          router.push('/admin')
        } catch (routerError) {
          console.log('Router failed, using window.location')
          window.location.href = '/admin'
        }
        return
      }

      // If no session, server auth failed  
      console.log('No session found after signIn attempt')
      setError('Geçersiz email veya şifre')
    } catch (error) {
      console.error('=== LOGIN ERROR DETAILS ===')
      console.error('Error type:', error?.constructor?.name)
      console.error('Error message:', error instanceof Error ? error.message : String(error))
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
      
      // Try to parse error if it's JSON
      if (error instanceof Error && error.message.includes('JSON')) {
        console.error('This appears to be a JSON parse error - server is returning HTML instead of JSON')
      }
      
      setError('Bir hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'))
    } finally {
      console.log('=== LOGIN DEBUG END ===')
      setIsLoading(false)
    }
  }

  return (
    <Layout className="flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-amber-600">Air-CRM</CardTitle>
          <CardDescription>
            Restoran yönetim sisteminize giriş yapın
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-amber-600 hover:bg-amber-700"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Giriş Yap
            </Button>
          </form>
        </CardContent>
      </Card>
    </Layout>
  )
}