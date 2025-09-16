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

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/admin'
      })

      if (result?.error) {
        setError('Geçersiz email veya şifre')
      } else if (result?.ok) {
        router.push('/admin')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
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