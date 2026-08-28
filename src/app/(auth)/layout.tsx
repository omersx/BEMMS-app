import React from 'react'
import { Activity } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="mb-8 flex items-center justify-center gap-2 text-primary">
        <Activity className="h-10 w-10" />
        <h1 className="text-3xl font-bold tracking-tight">BEMMS</h1>
      </div>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}