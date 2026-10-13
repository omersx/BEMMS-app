'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      if (res?.error) {
        if (res.error.includes('DATABASE_CONNECTION_ERROR')) {
          setError('Database connection error. Please verify the database service is running.')
        } else {
          setError('Invalid username, email, or password. Please verify your credentials.')
        }
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-destructive-foreground bg-destructive/90 rounded-md">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Username or Email</Label>
          <Input
            id="email"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            placeholder="admin or email@hospital.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="sr-only">Toggle password visibility</span>
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </CardFooter>
    </form>
  )
}
