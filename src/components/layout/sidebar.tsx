'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, QrCode, Monitor, TicketCheck, Wrench, BarChart3,
  Bell, Settings, Activity, ChevronLeft, ChevronRight, AlertTriangle,
  ClipboardList, Calendar, CheckSquare, Building2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'

interface SidebarProps {
  user: { name: string; role: string; email: string }
}

const SIDEBAR_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/scan', label: 'Scan QR', icon: QrCode },
  { href: '/devices', label: 'Devices', icon: Monitor },
  { href: '/departments', label: 'Departments', icon: Building2 },
  { href: '/tickets', label: 'Helpdesk Tickets', icon: TicketCheck },
  { href: '/tickets/triage', label: 'Triage Queue', icon: AlertTriangle },
  { href: '/maintenance', label: 'Maintenance', icon: Wrench },
  { href: '/maintenance/tasks', label: 'Work Orders', icon: ClipboardList },
  { href: '/maintenance/plans', label: 'PM Plans', icon: Calendar },
  { href: '/maintenance/checklists', label: 'Checklists', icon: CheckSquare },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/notifications', label: 'Notifications', icon: Bell },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const isAdmin = user.role.toLowerCase().includes('admin')

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
            {SIDEBAR_LINKS.map((link) => {
              const active = pathname === link.href || 
                (link.href !== '/tickets' && link.href !== '/maintenance' && pathname.startsWith(link.href + '/')) || 
                (link.href === '/tickets' && pathname.startsWith('/tickets') && !pathname.startsWith('/tickets/triage')) ||
                (link.href === '/maintenance' && pathname === '/maintenance')

              const navLink = (
                <Link
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                    active ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground",
                    collapsed && "justify-center px-0"
                  )}
                >
                  <link.icon className={cn("h-5 w-5 shrink-0", active ? "text-primary-foreground" : "")} />
                  {!collapsed && <span>{link.label}</span>}
                </Link>
              )

              if (collapsed) {
                return (
                  <Tooltip key={link.href}>
                    <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                    <TooltipContent side="right">{link.label}</TooltipContent>
                  </Tooltip>
                )
              }

              return <div key={link.href}>{navLink}</div>
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

              if (collapsed) {
                return (
                  <Tooltip>
                    <TooltipTrigger asChild>{adminLink}</TooltipTrigger>
                    <TooltipContent side="right">Administration</TooltipContent>
                  </Tooltip>
                )
              }

              return <div>{adminLink}</div>
            })()}
          </TooltipProvider>
        </nav>
      </ScrollArea>

      <div className="border-t border-border p-4">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary">
              {user.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">{user.name}</span>
              <span className="text-xs text-muted-foreground truncate">{user.role}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}