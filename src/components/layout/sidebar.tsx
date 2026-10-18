'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, QrCode, Monitor, TicketCheck, Wrench, BarChart3,
  Bell, Settings, Activity, ChevronLeft, ChevronRight, AlertTriangle,
  ClipboardList, Calendar, CheckSquare, Building2, UsersRound, PlusCircle,
  Inbox, LogOut
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import { NavBadge, type NavBadgeConfig } from './nav-badge'
import { useNavCounts } from '@/components/providers/nav-counts-provider'

interface SidebarProps {
  user: { name: string; role: string; email: string; roles: string[] }
}

export interface SidebarLink {
  href: string;
  label: string;
  icon: any;
  badgeKey?: 'notifications' | 'triage' | 'tickets' | 'maintenance' | 'workOrders' | 'pmPlans' | string;
  badgeConfig?: Partial<NavBadgeConfig>;
}

// Staff-specific nav: simplified, focused on their department
const STAFF_LINKS: SidebarLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/my-department', label: 'My Department', icon: Building2 },
  { href: '/scan', label: 'Scan QR', icon: QrCode },
  { href: '/tickets/create', label: 'Report Problem', icon: PlusCircle },
  { href: '/tickets', label: 'My Tickets', icon: TicketCheck, badgeKey: 'tickets' },
  { href: '/engineering-team', label: 'Engineering Team', icon: UsersRound },
  { href: '/notifications', label: 'Notifications', icon: Bell, badgeKey: 'notifications' },
]

// Engineer/Technician nav: workflow-optimized for BME daily work
const ENGINEER_LINKS: SidebarLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/scan', label: 'Scan QR', icon: QrCode },
  { href: '/tickets/triage', label: 'Triage Queue', icon: Inbox, badgeKey: 'triage' },
  { href: '/tickets', label: 'Helpdesk Tickets', icon: TicketCheck, badgeKey: 'tickets' },
  { href: '/devices', label: 'Devices', icon: Monitor },
  { href: '/departments', label: 'Departments', icon: Building2 },
  { href: '/team', label: 'Engineering Team', icon: UsersRound },
  { href: '/maintenance', label: 'Maintenance', icon: Wrench, badgeKey: 'maintenance' },
  { href: '/maintenance/tasks', label: 'Work Orders', icon: ClipboardList, badgeKey: 'workOrders' },
  { href: '/maintenance/plans', label: 'PM Plans', icon: Calendar, badgeKey: 'pmPlans' },
  { href: '/maintenance/checklists', label: 'Checklists', icon: CheckSquare },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/notifications', label: 'Notifications', icon: Bell, badgeKey: 'notifications' },
]

// Full nav for managers and admins (includes team management + admin access)
const FULL_LINKS: SidebarLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/scan', label: 'Scan QR', icon: QrCode },
  { href: '/devices', label: 'Devices', icon: Monitor },
  { href: '/departments', label: 'Departments', icon: Building2 },
  { href: '/team', label: 'Engineering Team', icon: UsersRound },
  { href: '/tickets', label: 'Helpdesk Tickets', icon: TicketCheck, badgeKey: 'tickets' },
  { href: '/tickets/triage', label: 'Triage Queue', icon: AlertTriangle, badgeKey: 'triage' },
  { href: '/maintenance', label: 'Maintenance', icon: Wrench, badgeKey: 'maintenance' },
  { href: '/maintenance/tasks', label: 'Work Orders', icon: ClipboardList, badgeKey: 'workOrders' },
  { href: '/maintenance/plans', label: 'PM Plans', icon: Calendar, badgeKey: 'pmPlans' },
  { href: '/maintenance/checklists', label: 'Checklists', icon: CheckSquare },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/notifications', label: 'Notifications', icon: Bell, badgeKey: 'notifications' },
]

function getSidebarLinks(roles: string[]): SidebarLink[] {
  const staffRoles = ['STAFF', 'DEPT_MGR'];
  const engineerRoles = ['BIOMED_ENG', 'BIOMED_TECH'];
  const adminManagerRoles = ['SYS_ADMIN', 'ORG_ADMIN', 'HOSP_ADMIN', 'BIOMED_MGR', 'AUDITOR'];

  const hasStaff = roles.some(r => staffRoles.includes(r));
  const hasEngineer = roles.some(r => engineerRoles.includes(r));
  const hasAdminManager = roles.some(r => adminManagerRoles.includes(r));

  // Admin/Manager roles get full nav (includes admin link)
  if (hasAdminManager) {
    return FULL_LINKS;
  }
  // Engineer/Technician get workflow-optimized nav
  if (hasEngineer) {
    return ENGINEER_LINKS;
  }
  // Staff-only users get simplified nav
  if (hasStaff) {
    return STAFF_LINKS;
  }
  return FULL_LINKS;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { resolveBadge } = useNavCounts()

  useEffect(() => {
    setMounted(true)
  }, [])
  const isAdmin = user.roles.some(r => ['SYS_ADMIN', 'ORG_ADMIN', 'HOSP_ADMIN'].includes(r))
  const links = getSidebarLinks(user.roles)

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col fixed inset-y-0 left-0 z-50 bg-card border-r border-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center h-16 shrink-0 px-4 border-b border-border justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-primary overflow-hidden">
          <Activity className="h-6 w-6 shrink-0" />
          {!collapsed && <span className="text-lg font-bold tracking-tight truncate">BEMMS</span>}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hidden md:flex"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          <TooltipProvider delayDuration={0}>
            {links.map((link) => {
              const active = pathname === link.href || 
                (link.href !== '/tickets' && link.href !== '/maintenance' && link.href !== '/tickets/create' && pathname.startsWith(link.href + '/')) || 
                (link.href === '/tickets' && pathname.startsWith('/tickets') && !pathname.startsWith('/tickets/triage') && !pathname.startsWith('/tickets/create')) ||
                (link.href === '/maintenance' && pathname === '/maintenance')

              const badge = resolveBadge(link.badgeKey, link.badgeConfig, { isCollapsed: collapsed })

              const navLink = (
                <Link
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                    active ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground",
                    collapsed && "justify-center px-0"
                  )}
                >
                  <div className="relative flex items-center justify-center shrink-0">
                    <link.icon className={cn("h-5 w-5 shrink-0", active ? "text-primary-foreground" : "")} />
                    {collapsed && badge && (
                      <NavBadge {...badge} position="icon-corner" />
                    )}
                  </div>
                  {!collapsed && (
                    <>
                      <span className="truncate">{link.label}</span>
                      {badge && (
                        <NavBadge
                          {...badge}
                          position="trailing"
                          className={active && badge.variant === 'secondary' ? 'bg-primary-foreground/20 text-primary-foreground' : undefined}
                        />
                      )}
                    </>
                  )}
                </Link>
              )

              return (
                <div key={link.href}>
                  {mounted && collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                      <TooltipContent side="right" className="flex items-center gap-2">
                        <span>{link.label}</span>
                        {badge && <NavBadge {...badge} position="inline" />}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    navLink
                  )}
                </div>
              )
            })}
            {isAdmin && (() => {
              const adminLink = (
                <Link
                  href="/admin"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 mt-4 rounded-md transition-colors text-sm font-medium",
                    pathname.startsWith('/admin') ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground",
                    collapsed && "justify-center px-0"
                  )}
                >
                  <Settings className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>Administration</span>}
                </Link>
              )

              return (
                <div key="/admin">
                  {mounted && collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{adminLink}</TooltipTrigger>
                      <TooltipContent side="right">Administration</TooltipContent>
                    </Tooltip>
                  ) : (
                    adminLink
                  )}
                </div>
              )
            })()}
          </TooltipProvider>
        </nav>
      </ScrollArea>

      <div className="border-t border-border p-3">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <Link
              href="/profile"
              className="hover:opacity-80 transition rounded-lg p-1 hover:bg-muted/50"
              title="View My Profile"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {user.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            {mounted && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => signOut({ callbackUrl: '/login' })}
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="sr-only">Log out</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Log out</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/profile"
              className="flex items-center gap-3 hover:opacity-80 transition rounded-lg p-1.5 -m-1 hover:bg-muted/50 flex-1 min-w-0"
              title="View My Profile"
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {user.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate leading-tight">{user.name}</span>
                <span className="text-[11px] text-muted-foreground truncate leading-tight">{user.role}</span>
              </div>
            </Link>
            {mounted && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => signOut({ callbackUrl: '/login' })}
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="sr-only">Log out</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Log out</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}