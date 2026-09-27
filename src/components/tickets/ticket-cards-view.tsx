"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { TicketCard, TicketItem, getTicketStatusStyle } from "./ticket-card"
import { TicketPriorityBadge, TicketStatusBadge } from "./ticket-badges"
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
  Inbox,
  Filter,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TicketCardsViewProps {
  tickets: TicketItem[]
}

type StatusCategory = "all" | "new" | "in_progress" | "waiting_parts_vendor" | "resolved" | "closed"

export function TicketCardsView({ tickets }: TicketCardsViewProps) {
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards")
  const [statusFilter, setStatusFilter] = useState<StatusCategory>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Compute category counts
  const counts = useMemo(() => {
    const res = {
      all: tickets.length,
      new: 0,
      in_progress: 0,
      waiting_parts_vendor: 0,
      resolved: 0,
      closed: 0,
    }

    tickets.forEach((t) => {
      if (["new", "acknowledged", "in_triage"].includes(t.statusCode)) {
        res.new++
      } else if (t.statusCode === "in_progress") {
        res.in_progress++
      } else if (["waiting_parts_vendor", "waiting_requester"].includes(t.statusCode)) {
        res.waiting_parts_vendor++
      } else if (t.statusCode === "resolved") {
        res.resolved++
      } else if (["closed", "cancelled"].includes(t.statusCode)) {
        res.closed++
      }
    })

    return res
  }, [tickets])

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // 1. Status Filter
      if (statusFilter === "new" && !["new", "acknowledged", "in_triage"].includes(t.statusCode)) {
        return false
      }
      if (statusFilter === "in_progress" && t.statusCode !== "in_progress") {
        return false
      }
      if (
        statusFilter === "waiting_parts_vendor" &&
        !["waiting_parts_vendor", "waiting_requester"].includes(t.statusCode)
      ) {
        return false
      }
      if (statusFilter === "resolved" && t.statusCode !== "resolved") {
        return false
      }
      if (statusFilter === "closed" && !["closed", "cancelled"].includes(t.statusCode)) {
        return false
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchTitle = t.title?.toLowerCase().includes(query)
        const matchNumber = t.ticketNumber?.toLowerCase().includes(query)
        const matchDevice = t.device?.name?.toLowerCase().includes(query) || t.device?.assetNumber?.toLowerCase().includes(query)
        const matchDept = t.department?.name?.toLowerCase().includes(query) || t.hospital?.name?.toLowerCase().includes(query)
        const matchReporter = t.reportedByUser?.fullName?.toLowerCase().includes(query)
        const matchAssignee = t.assignedEngineer?.fullName?.toLowerCase().includes(query)
        const matchParts = t.waitingReason?.toLowerCase().includes(query)

        if (!matchTitle && !matchNumber && !matchDevice && !matchDept && !matchReporter && !matchAssignee && !matchParts) {
          return false
        }
      }

      return true
    })
  }, [tickets, statusFilter, searchQuery])

  const filterButtons: Array<{
    id: StatusCategory
    label: string
    count: number
    dotColor?: string
    activeClass: string
  }> = [
    {
      id: "all",
      label: "All Tickets",
      count: counts.all,
      activeClass: "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900",
    },
    {
      id: "new",
      label: "New / Unassigned",
      count: counts.new,
      dotColor: "bg-rose-500",
      activeClass: "bg-rose-600 text-white dark:bg-rose-600",
    },
    {
      id: "in_progress",
      label: "In Progress",
      count: counts.in_progress,
      dotColor: "bg-amber-500",
      activeClass: "bg-amber-600 text-white dark:bg-amber-600",
    },
    {
      id: "waiting_parts_vendor",
      label: "Waiting for Parts",
      count: counts.waiting_parts_vendor,
      dotColor: "bg-orange-500",
      activeClass: "bg-orange-600 text-white dark:bg-orange-600",
    },
    {
      id: "resolved",
      label: "Resolved",
      count: counts.resolved,
      dotColor: "bg-emerald-500",
      activeClass: "bg-emerald-600 text-white dark:bg-emerald-600",
    },
    {
      id: "closed",
      label: "Closed",
      count: counts.closed,
      dotColor: "bg-slate-400",
      activeClass: "bg-slate-600 text-white dark:bg-slate-600",
    },
  ]

  return (
    <div className="space-y-4">
      {/* Control Bar: Search, Filters, and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets by title, number, device, department..."
            className="pl-9 pr-8 h-10 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 self-end sm:self-auto bg-muted/60 p-1 rounded-lg border border-border/60">
          <Button
            variant={viewMode === "cards" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("cards")}
            className="h-8 gap-1.5 text-xs px-3"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Cards</span>
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
            className="h-8 gap-1.5 text-xs px-3"
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Table</span>
          </Button>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filterButtons.map((btn) => {
          const isActive = statusFilter === btn.id
          return (
            <button
              key={btn.id}
              onClick={() => setStatusFilter(btn.id)}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border shrink-0",
                isActive
                  ? `${btn.activeClass} border-transparent shadow-sm`
                  : "bg-background border-border hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {btn.dotColor && (
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    isActive ? "bg-white" : btn.dotColor
                  )}
                />
              )}
              <span>{btn.label}</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[11px] font-mono",
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {btn.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Filter summary when search or non-all filter is active */}
      {(statusFilter !== "all" || searchQuery) && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>
            Showing <strong>{filteredTickets.length}</strong> of {tickets.length} tickets
            {statusFilter !== "all" ? ` in ${filterButtons.find(b => b.id === statusFilter)?.label}` : ""}
            {searchQuery ? ` matching "${searchQuery}"` : ""}
          </span>
          <button
            onClick={() => {
              setStatusFilter("all")
              setSearchQuery("")
            }}
            className="text-primary hover:underline font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Empty State */}
      {filteredTickets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <Inbox className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
          <h3 className="font-semibold text-base mb-1">No matching tickets</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
            {searchQuery
              ? `No tickets found matching "${searchQuery}". Try a different search term or clear filters.`
              : "No tickets found in this status category."}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStatusFilter("all")
              setSearchQuery("")
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : viewMode === "cards" ? (
        /* Cards Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      ) : (
        /* Table View with Status Accent Rails */
        <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-[140px]">Ticket #</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Device</TableHead>
                <TableHead className="hidden md:table-cell">Department</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Assigned To</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket) => {
                const style = getTicketStatusStyle(ticket.statusCode)
                return (
                  <TableRow
                    key={ticket.id}
                    className={cn(
                      "transition-colors border-l-4 hover:bg-muted/40",
                      style.rail
                    )}
                  >
                    <TableCell className="font-mono text-xs font-semibold">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="text-primary hover:underline"
                      >
                        {ticket.ticketNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="font-medium hover:underline line-clamp-1 text-sm text-foreground"
                      >
                        {ticket.title}
                      </Link>
                      {ticket.statusCode === "waiting_parts_vendor" && ticket.waitingReason && (
                        <span className="text-[11px] text-orange-700 dark:text-orange-300 block truncate">
                          📦 On Order: {ticket.waitingReason}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="font-medium text-foreground block truncate">
                        {ticket.device?.name || "—"}
                      </span>
                      {ticket.device?.assetNumber && (
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {ticket.device.assetNumber}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      <span className="block truncate">
                        {ticket.hospital?.name ? `${ticket.hospital.name} / ` : ""}
                        {ticket.department?.name || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <TicketPriorityBadge priority={ticket.priorityCode} />
                    </TableCell>
                    <TableCell>
                      <TicketStatusBadge status={ticket.statusCode} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs">
                      {ticket.assignedEngineer?.fullName ? (
                        <span className="font-medium text-foreground">
                          {ticket.assignedEngineer.fullName}
                        </span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 font-semibold">
                          Unassigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-right text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(
                        ticket.reportedAt || ticket.createdAt || Date.now()
                      ).toLocaleDateString()}
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
