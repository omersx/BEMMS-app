"use client"

import { useState, useMemo, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { acceptTicket } from "@/lib/actions/tickets"
import { TicketPriorityBadge, TicketStatusBadge, TicketImpactBadge } from "./ticket-badges"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  LayoutGrid,
  Table as TableIcon,
  Search,
  X,
  Clock,
  Monitor,
  MapPin,
  CheckCircle,
  ArrowRight,
  AlertTriangle,
  Loader2,
  Inbox,
  Filter,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface TriageTicketItem {
  id: string
  ticketNumber: string
  title: string
  description?: string | null
  statusCode: string
  priorityCode: string
  reportedImpact?: string | null
  reportedProblemCategory?: string | null
  waitingReason?: string | null
  reportedAt?: Date | string | null
  createdAt?: Date | string | null
  assignedEngineerUserId?: string | null
  device?: {
    id?: string
    name: string
    assetNumber?: string | null
    currentStatusCode?: string | null
  } | null
  hospital?: {
    id?: string
    name: string
  } | null
  department?: {
    id?: string
    name: string
  } | null
  reportedByUser?: {
    id?: string
    fullName?: string | null
  } | null
  assignedEngineer?: {
    id?: string
    fullName?: string | null
  } | null
}

interface TriageQueueViewProps {
  tickets: TriageTicketItem[]
}

type TriageFilter = "all" | "critical" | "unaccepted" | "overdue"

function getAgeInfo(reportedAt?: Date | string | null) {
  if (!reportedAt) return { text: "< 1m", isAlert: false }
  const ms = Math.max(0, Date.now() - new Date(reportedAt).getTime())
  const minutes = Math.floor(ms / (1000 * 60))
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return { text: "just now", isAlert: false }
  if (minutes < 60) return { text: `${minutes}m ago`, isAlert: false }
  if (hours < 24) return { text: `${hours}h ago`, isAlert: hours > 4 }
  return { text: `${days}d ${hours % 24}h`, isAlert: true }
}

export function TriageQueueView({ tickets }: TriageQueueViewProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards")
  const [filter, setFilter] = useState<TriageFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Compute metric counts
  const counts = useMemo(() => {
    let critical = 0
    let unaccepted = 0
    let overdue = 0

    tickets.forEach((t) => {
      if (t.reportedImpact === "patient_care_affected" || t.priorityCode === "p1_critical") {
        critical++
      }
      if (!t.assignedEngineerUserId && t.statusCode === "new") {
        unaccepted++
      }
      if (t.reportedAt) {
        const hours = (Date.now() - new Date(t.reportedAt).getTime()) / (1000 * 60 * 60)
        if (hours > 4) overdue++
      }
    })

    return { all: tickets.length, critical, unaccepted, overdue }
  }, [tickets])

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // 1. Category Filter
      if (filter === "critical") {
        if (t.reportedImpact !== "patient_care_affected" && t.priorityCode !== "p1_critical") {
          return false
        }
      } else if (filter === "unaccepted") {
        if (t.assignedEngineerUserId || t.statusCode !== "new") {
          return false
        }
      } else if (filter === "overdue") {
        const hours = t.reportedAt ? (Date.now() - new Date(t.reportedAt).getTime()) / (1000 * 60 * 60) : 0
        if (hours <= 4) return false
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchTitle = t.title?.toLowerCase().includes(query)
        const matchNumber = t.ticketNumber?.toLowerCase().includes(query)
        const matchDevice = t.device?.name?.toLowerCase().includes(query) || t.device?.assetNumber?.toLowerCase().includes(query)
        const matchDept = t.department?.name?.toLowerCase().includes(query) || t.hospital?.name?.toLowerCase().includes(query)
        const matchReporter = t.reportedByUser?.fullName?.toLowerCase().includes(query)
        return Boolean(matchTitle || matchNumber || matchDevice || matchDept || matchReporter)
      }

      return true
    })
  }, [tickets, filter, searchQuery])

  // Quick Accept handler
  const handleQuickAccept = async (ticketId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setAcceptingId(ticketId)
    try {
      const res = await acceptTicket(ticketId)
      if (res?.success) {
        toast.success("Ticket accepted! Now in progress.")
        startTransition(() => {
          router.refresh()
        })
      } else {
        toast.error((res as any)?.error || "Failed to accept ticket")
      }
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setAcceptingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search Bar & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search queue by ticket #, issue, device, department..."
            className="pl-9 pr-9 text-xs sm:text-sm h-9 bg-card"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* View Mode Toggle (Hidden on small mobile where card view is best) */}
        <div className="hidden sm:flex items-center gap-1 bg-muted p-1 rounded-lg self-end shrink-0">
          <Button
            variant={viewMode === "cards" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("cards")}
            className="h-7 px-2.5 text-xs gap-1"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Cards
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
            className="h-7 px-2.5 text-xs gap-1"
          >
            <TableIcon className="w-3.5 h-3.5" />
            Table
          </Button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none touch-pan-x text-xs">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-3 py-1.5 rounded-full border transition whitespace-nowrap font-medium shrink-0 flex items-center gap-1.5",
            filter === "all"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          All Requests
          <span className="opacity-80">({counts.all})</span>
        </button>

        <button
          onClick={() => setFilter("critical")}
          className={cn(
            "px-3 py-1.5 rounded-full border transition whitespace-nowrap font-medium shrink-0 flex items-center gap-1.5",
            filter === "critical"
              ? "bg-red-600 text-white border-red-600 shadow-xs"
              : counts.critical > 0
              ? "border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20"
              : "bg-muted/40 text-muted-foreground hover:bg-muted"
          )}
        >
          <AlertTriangle className="w-3 h-3" />
          Critical
          <span>({counts.critical})</span>
        </button>

        <button
          onClick={() => setFilter("unaccepted")}
          className={cn(
            "px-3 py-1.5 rounded-full border transition whitespace-nowrap font-medium shrink-0 flex items-center gap-1.5",
            filter === "unaccepted"
              ? "bg-amber-600 text-white border-amber-600 shadow-xs"
              : counts.unaccepted > 0
              ? "border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20"
              : "bg-muted/40 text-muted-foreground hover:bg-muted"
          )}
        >
          <Clock className="w-3 h-3" />
          Unaccepted
          <span>({counts.unaccepted})</span>
        </button>

        <button
          onClick={() => setFilter("overdue")}
          className={cn(
            "px-3 py-1.5 rounded-full border transition whitespace-nowrap font-medium shrink-0 flex items-center gap-1.5",
            filter === "overdue"
              ? "bg-orange-600 text-white border-orange-600 shadow-xs"
              : "bg-muted/40 text-muted-foreground hover:bg-muted"
          )}
        >
          Waiting &gt; 4h
          <span>({counts.overdue})</span>
        </button>
      </div>

      {/* Main Content Area */}
      {filteredTickets.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center bg-muted/10 space-y-2">
          <Inbox className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <h3 className="font-semibold text-foreground text-sm">No tickets match the selected filters</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Try clearing the search query or selecting &quot;All Requests&quot; to review the complete triage queue.
          </p>
          {(filter !== "all" || searchQuery) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilter("all")
                setSearchQuery("")
              }}
              className="mt-2 text-xs"
            >
              Reset Filters
            </Button>
          )}
        </div>
      ) : viewMode === "cards" ? (
        /* ── Cards View (Default on mobile, optional on desktop) ── */
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTickets.map((ticket) => {
            const age = getAgeInfo(ticket.reportedAt)
            const isUnaccepted = !ticket.assignedEngineerUserId && ticket.statusCode === "new"
            const isAccepting = acceptingId === ticket.id

            return (
              <div
                key={ticket.id}
                className={cn(
                  "rounded-xl border bg-card p-4 shadow-xs transition-all duration-150 hover:shadow-md flex flex-col justify-between space-y-3",
                  ticket.reportedImpact === "patient_care_affected"
                    ? "border-red-300 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/10"
                    : "border-border"
                )}
              >
                <div className="space-y-2.5">
                  {/* Top Bar: Ticket #, Priority, Impact, Age */}
                  <div className="flex items-center justify-between gap-1.5 flex-wrap">
                    <Link
                      href={`/tickets/${ticket.id}`}
                      className="font-mono text-xs font-bold text-primary hover:underline"
                    >
                      {ticket.ticketNumber}
                    </Link>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <TicketPriorityBadge priority={ticket.priorityCode} />
                      {ticket.reportedImpact && (
                        <TicketImpactBadge impact={ticket.reportedImpact} />
                      )}
                      <span
                        className={cn(
                          "text-[11px] font-medium inline-flex items-center gap-1 px-1.5 py-0.5 rounded",
                          age.isAlert
                            ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <Clock className="w-2.5 h-2.5" />
                        {age.text}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <Link href={`/tickets/${ticket.id}`} className="block group">
                    <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors leading-snug">
                      {ticket.title}
                    </h4>
                  </Link>

                  {/* Device & Location */}
                  <div className="space-y-1 text-xs text-muted-foreground pt-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Monitor className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                      <span className="font-medium text-foreground truncate">
                        {ticket.device?.name || "No linked device"}
                      </span>
                      {ticket.device?.assetNumber && (
                        <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                          ({ticket.device.assetNumber})
                        </span>
                      )}
                    </div>

                    {(ticket.hospital?.name || ticket.department?.name) && (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                        <span className="truncate">
                          {ticket.department?.name || "Department"} · {ticket.hospital?.name || "Hospital"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Waiting Dispatch Indicator */}
                  {isUnaccepted && (
                    <div className="rounded-lg bg-amber-50/80 dark:bg-amber-950/30 p-2 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
                      <span className="font-medium">Waiting for engineer assignment</span>
                    </div>
                  )}
                </div>

                {/* Action Footer */}
                <div className="pt-2.5 border-t border-border/60 flex items-center gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-8 gap-1"
                  >
                    <Link href={`/tickets/${ticket.id}`}>
                      <span>Review &amp; Triage</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </Button>

                  {isUnaccepted && (
                    <Button
                      size="sm"
                      onClick={(e) => handleQuickAccept(ticket.id, e)}
                      disabled={isAccepting}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs h-8 gap-1.5 px-3 shadow-xs"
                    >
                      {isAccepting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Accepting...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ── Table View (Available via toggle on desktop) ── */
        <div className="rounded-xl border bg-card overflow-x-auto shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[110px]">Priority</TableHead>
                <TableHead className="w-[130px]">Ticket #</TableHead>
                <TableHead className="min-w-[200px]">Issue</TableHead>
                <TableHead className="w-[150px]">Reported Impact</TableHead>
                <TableHead className="min-w-[180px]">Location</TableHead>
                <TableHead className="w-[90px]">Status</TableHead>
                <TableHead className="w-[80px]">Age</TableHead>
                <TableHead className="w-[120px] text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket) => {
                const age = getAgeInfo(ticket.reportedAt)
                const isUnaccepted = !ticket.assignedEngineerUserId && ticket.statusCode === "new"
                const isAccepting = acceptingId === ticket.id

                return (
                  <TableRow key={ticket.id} className="hover:bg-muted/40">
                    <TableCell>
                      <TicketPriorityBadge priority={ticket.priorityCode} />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="text-primary hover:underline font-mono text-xs font-bold"
                      >
                        {ticket.ticketNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Link
                          href={`/tickets/${ticket.id}`}
                          className="font-medium hover:underline line-clamp-1 text-sm text-foreground"
                        >
                          {ticket.title}
                        </Link>
                        <p className="text-xs text-muted-foreground truncate">
                          {ticket.device?.name || "No device"}
                        </p>
                        {isUnaccepted && (
                          <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                            <Clock className="w-3 h-3 animate-pulse" />
                            <span>Waiting for engineer</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {ticket.reportedImpact ? (
                        <TicketImpactBadge impact={ticket.reportedImpact} />
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs truncate block">
                        {ticket.department?.name || "Dept"} · {ticket.hospital?.name || "Hospital"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <TicketStatusBadge status={ticket.statusCode} />
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "text-xs font-medium inline-flex items-center gap-1",
                          age.isAlert ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                        )}
                      >
                        <Clock className="w-3 h-3" />
                        {age.text}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                          <Link href={`/tickets/${ticket.id}`}>Review</Link>
                        </Button>
                        {isUnaccepted && (
                          <Button
                            size="sm"
                            onClick={(e) => handleQuickAccept(ticket.id, e)}
                            disabled={isAccepting}
                            className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2"
                          >
                            {isAccepting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Accept"}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
