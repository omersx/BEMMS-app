import React from 'react'
import { Activity } from 'lucide-react'
import { ThemeToggle } from '@/components/theme/theme-toggle'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-200" suppressHydrationWarning>
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="mb-8 flex items-center justify-center gap-2 text-primary" suppressHydrationWarning>
        <Activity className="h-10 w-10" />
        <h1 className="text-3xl font-bold tracking-tight">BEMMS</h1>
      </div>
      <div className="w-full max-w-md" suppressHydrationWarning>
        {children}
      </div>
    </div>
  )
}
