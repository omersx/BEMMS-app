'use client'

import * as React from 'react'
import { useTheme, type Theme } from '@/components/providers/theme-provider'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ThemeSelectorCard() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const options: { value: Theme; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ]

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
        Appearance & Theme
      </h3>
      <div className="bg-card rounded-xl border p-3 sm:p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-snug">Interface Theme</span>
            <span className="text-xs text-muted-foreground">
              Select your preferred visual style or sync with device settings
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3.5">
          {options.map((opt) => {
            const Icon = opt.icon
            const isSelected = mounted && theme === opt.value

            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                className={cn(
                  "flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all min-h-[44px]",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-transparent"
                )}
              >
                <Icon className={cn("w-4 h-4", isSelected ? "text-primary-foreground" : "")} />
                <span>{opt.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
