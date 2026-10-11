'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { LogOut, Loader2 } from 'lucide-react'
import { Button, ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SignOutButtonProps extends ButtonProps {
  showIcon?: boolean
  label?: string
  redirectUrl?: string
}

export function SignOutButton({
  showIcon = true,
  label = 'Log out',
  redirectUrl = '/login',
  className,
  variant = 'outline',
  size = 'default',
  ...props
}: SignOutButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    try {
      setLoading(true)
      await signOut({ callbackUrl: redirectUrl })
    } catch {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      disabled={loading}
      onClick={handleSignOut}
      className={cn(className)}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      ) : showIcon ? (
        <LogOut className="w-4 h-4 mr-2" />
      ) : null}
      {loading ? 'Logging out...' : label}
    </Button>
  )
}
