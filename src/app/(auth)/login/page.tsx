'use client'

import dynamic from 'next/dynamic'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const LoginForm = dynamic(
  () => import('@/components/auth/login-form').then((mod) => mod.LoginForm),
  {
    ssr: false,
    loading: () => (
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="h-4 w-28 bg-muted animate-pulse rounded" />
          <div className="h-9 w-full bg-muted/40 rounded-md border border-input animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-20 bg-muted animate-pulse rounded" />
          <div className="h-9 w-full bg-muted/40 rounded-md border border-input animate-pulse" />
        </div>
        <Button className="w-full mt-2" disabled>
          Sign In
        </Button>
      </CardContent>
    ),
  }
)

export default function LoginPage() {
  return (
    <Card className="w-full shadow-lg border-border/40">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl">Sign In</CardTitle>
        <CardDescription>
          Enter your username or email and password to access your account
        </CardDescription>
      </CardHeader>
      <LoginForm />
    </Card>
  )
}
