"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { TicketCheck, Inbox, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useNavCounts } from "@/components/providers/nav-counts-provider"

interface TicketsNavProps {
  className?: string
  showCreateButton?: boolean
}

const TABS = [
  {
    href: "/tickets",
    label: "All Tickets",
    icon: TicketCheck,
    exact: true,
  },
  {
    href: "/tickets/triage",
    label: "Triage Queue",
    icon: Inbox,
    exact: false,
    hasBadge: true,
  },
]

export function TicketsNav({
  className,
  showCreateButton = true,
}: TicketsNavProps) {
  const pathname = usePathname()
  const { counts } = useNavCounts()

  const isTabActive = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href
    }
    return pathname === href || pathname.startsWith(href + "/")
  }

  const triageCount = counts.triage ?? 0

  return (
    <div
      className={cn(
        "flex flex-row items-center justify-between gap-2 border-b border-border pb-3 mb-4 sm:mb-6",
        className
      )}
    >
      {/* Navigation Tabs */}
      <nav
        aria-label="Helpdesk navigation"
        className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5"
      >
        {TABS.map((tab) => {
          const active = isTabActive(tab.href, tab.exact)
          const Icon = tab.icon
          const showBadge = tab.hasBadge && triageCount > 0

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 shrink-0 select-none",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", active ? "text-primary-foreground" : "text-muted-foreground")} />
              <span>{tab.label}</span>
              {showBadge && (
                <span
                  className={cn(
                    "ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] sm:text-xs font-bold rounded-full leading-none",
                    active
                      ? "bg-primary-foreground text-primary"
                      : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                  )}
                >
                  {triageCount > 99 ? "99+" : triageCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Action button */}
      {showCreateButton && (
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/tickets/create">
            <Button size="sm" className="gap-1 sm:gap-1.5 h-8 sm:h-9 text-xs shadow-sm px-2.5 sm:px-3">
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Report Problem</span>
              <span className="sm:hidden">Report</span>
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
