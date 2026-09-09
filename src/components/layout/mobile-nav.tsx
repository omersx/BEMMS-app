'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, QrCode, PlusCircle, ClipboardList, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MobileNav() {
  const pathname = usePathname()

  const tabs = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/scan', label: 'Scan', icon: QrCode },
    { href: '/tickets/create', label: 'Report', icon: PlusCircle },
    { href: '/maintenance/tasks', label: 'Work', icon: ClipboardList },
    { href: '/more', label: 'More', icon: Menu },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border pb-[env(safe-area-inset-bottom)]">
      <nav className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + '/') && tab.href !== '/dashboard'
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full min-w-[44px] min-h-[44px] gap-1",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className={cn("h-5 w-5", active && "fill-primary/20")} />
              <span className="text-[10px] font-medium leading-none">{tab.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}