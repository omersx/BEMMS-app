'use client'

import * as React from 'react'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
  systemTheme: 'light' | 'dark'
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined)

const STORAGE_KEY = 'bemms-theme'

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  attribute?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = STORAGE_KEY,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme)
  const [systemTheme, setSystemTheme] = React.useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = React.useState(false)

  // Initialize theme from storage
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey) as Theme | null
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setThemeState(stored)
      }
    } catch {
      // Ignore localStorage read errors
    }

    const currentSystem = getSystemTheme()
    setSystemTheme(currentSystem)
    setMounted(true)
  }, [storageKey])

  // Listen to system theme changes
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const resolvedTheme: 'light' | 'dark' = theme === 'system' ? systemTheme : theme

  // Apply class to documentElement
  React.useEffect(() => {
    if (!mounted) return
    const root = document.documentElement

    if (resolvedTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [resolvedTheme, mounted])

  const setTheme = React.useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme)
      try {
        localStorage.setItem(storageKey, newTheme)
      } catch {
        // Ignore localStorage write errors
      }
    },
    [storageKey]
  )

  const value = React.useMemo(
    () => ({
      theme,
      setTheme,
      resolvedTheme: mounted ? resolvedTheme : 'light',
      systemTheme,
    }),
    [theme, setTheme, resolvedTheme, systemTheme, mounted]
  )

  return (
    <ThemeContext.Provider value={value}>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('${storageKey}');var s=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&s)||(t==='system'&&s)){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})()`,
        }}
      />
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextType {
  const context = React.useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
