'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, QrCode, PlusCircle, ClipboardList, Menu, TicketCheck, Inbox, Monitor, Route } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NavBadge, type NavBadgeConfig } from './nav-badge'
import { useNavCounts } from '@/components/providers/nav-counts-provider'

interface MobileTab {
  href: string;
  label: string;
  icon: any;
  badgeKey?: 'notifications' | 'triage' | 'tickets' | 'maintenance' | 'workOrders' | 'pmPlans' | string;
  badgeConfig?: Partial<NavBadgeConfig>;
}

interface MobileNavProps {
  roles?: string[];
}

export function MobileNav({ roles = [] }: MobileNavProps) {
  const pathname = usePathname()
  const { resolveBadge } = useNavCounts()

  const staffRoles = ['STAFF', 'DEPT_MGR'];
  const engineerRoles = ['BIOMED_ENG', 'BIOMED_TECH'];
  const adminManagerRoles = ['SYS_ADMIN', 'ORG_ADMIN', 'HOSP_ADMIN', 'BIOMED_MGR', 'AUDITOR'];

  const hasStaff = roles.some(r => staffRoles.includes(r));
  const hasEngineer = roles.some(r => engineerRoles.includes(r));
  const hasAdminManager = roles.some(r => adminManagerRoles.includes(r));
  const isStaffOnly = hasStaff && !hasEngineer && !hasAdminManager;

  const staffTabs: MobileTab[] = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/scan', label: 'Scan', icon: QrCode },
    { href: '/tickets/create', label: 'Report', icon: PlusCircle },
    { href: '/tickets', label: 'Tickets', icon: TicketCheck, badgeKey: 'tickets' },
    { href: '/more', label: 'More', icon: Menu, badgeKey: 'notifications' },
  ]

  // Engineer-optimized: Quick access to Daily Round, Scan, and Triage
  const engineerTabs: MobileTab[] = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/rounds', label: 'Round', icon: Route },
    { href: '/scan', label: 'Scan', icon: QrCode },
    { href: '/tickets/triage', label: 'Triage', icon: Inbox, badgeKey: 'triage' },
    { href: '/more', label: 'More', icon: Menu, badgeKey: 'notifications' },
  ]

  const fullTabs: MobileTab[] = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/scan', label: 'Scan', icon: QrCode },
    { href: '/tickets/create', label: 'Report', icon: PlusCircle },
    { href: '/maintenance/tasks', label: 'Work', icon: ClipboardList, badgeKey: 'workOrders' },
    { href: '/more', label: 'More', icon: Menu, badgeKey: 'notifications' },
  ]

  const tabs = isStaffOnly ? staffTabs : hasEngineer && !hasAdminManager ? engineerTabs : fullTabs;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border pb-[env(safe-area-inset-bottom)]">
      <nav className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const active = pathname === tab.href || (pathname.startsWith(tab.href + '/') && tab.href !== '/dashboard')
          const badge = resolveBadge(tab.badgeKey, tab.badgeConfig, { isCollapsed: true })

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full min-w-[44px] min-h-[44px] gap-1 relative",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative flex items-center justify-center shrink-0">
                <tab.icon className={cn("h-5 w-5", active && "fill-primary/20")} />
                {badge && (
                  <NavBadge {...badge} position="icon-corner" />
                )}
              </div>
              <span className="text-[10px] font-medium leading-none">{tab.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}