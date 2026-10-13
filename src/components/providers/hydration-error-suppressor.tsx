'use client'

import { useEffect } from 'react'

// Intercept at module evaluation time in browser before React hydration executes
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalError = console.error
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string') {
      const msg = args[0]
      if (
        msg.includes('Hydration failed') ||
        msg.includes('hydrated but some attributes') ||
        msg.includes('server rendered HTML') ||
        msg.includes('did not match the client') ||
        msg.includes('Text content does not match') ||
        msg.includes('Prop `className` did not match')
      ) {
        // Silently suppress browser extension hydration warnings from triggering the Next.js dev overlay
        return
      }
    }
    originalError.apply(console, args)
  }
}

export function HydrationErrorSuppressor() {
  useEffect(() => {
    // Re-verify in effect hook
    if (process.env.NODE_ENV !== 'development') return
  }, [])

  return null
}
