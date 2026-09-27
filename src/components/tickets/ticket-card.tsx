"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { TicketPriorityBadge, TicketStatusBadge } from "./ticket-badges"
import { Monitor, MapPin, User, Calendar, Package } from "lucide-react"

export interface TicketItem {
  id: string
  ticketNumber: string
  title: string
  description?: string | null
  statusCode: string
  priorityCode: string
  reportedImpact?: string | null
  waitingReason?: string | null
  waitingDependencyType?: string | null
  reportedAt?: Date | string | null
  createdAt?: Date | string | null
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

export function getTicketStatusStyle(statusCode: string) {
  switch (statusCode) {
    case "new":
    case "acknowledged":
    case "in_triage":
      return {
        rail: "border-l-rose-500",
        bg: "bg-rose-50/35 dark:bg-rose-950/20 hover:bg-rose-50/70 dark:hover:bg-rose-950/30",
        border: "border-rose-200/80 dark:border-rose-900/40",
        label: "Attention Needed",
        dot: "bg-rose-500",
      }
    case "in_progress":
      return {
        rail: "border-l-amber-500",
        bg: "bg-amber-50/35 dark:bg-amber-950/20 hover:bg-amber-50/70 dark:hover:bg-amber-950/30",
        border: "border-amber-200/80 dark:border-amber-900/40",
        label: "In Progress",
        dot: "bg-amber-500",
      }
    case "waiting_parts_vendor":
    case "waiting_requester":
      return {
        rail: "border-l-orange-500",
        bg: "bg-orange-50/35 dark:bg-orange-950/20 hover:bg-orange-50/70 dark:hover:bg-orange-950/30",
        border: "border-orange-200/80 dark:border-orange-900/40",
        label: "Waiting for Parts",
        dot: "bg-orange-500",
      }
    case "resolved":
      return {
        rail: "border-l-emerald-500",
        bg: "bg-emerald-50/35 dark:bg-emerald-950/20 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30",
        border: "border-emerald-200/80 dark:border-emerald-900/40",
        label: "Resolved",
        dot: "bg-emerald-500",
      }
    case "closed":
      return {
        rail: "border-l-slate-400 dark:border-l-slate-600",
        bg: "bg-slate-50/50 dark:bg-slate-900/20 hover:bg-slate-100/50 dark:hover:bg-slate-900/40",
        border: "border-slate-200/80 dark:border-slate-800/40",
        label: "Closed",
        dot: "bg-slate-400",
      }
    case "cancelled":
    default:
      return {
        rail: "border-l-zinc-300 dark:border-l-zinc-700",
        bg: "bg-zinc-50/30 dark:bg-zinc-900/10 hover:bg-zinc-100/40 dark:hover:bg-zinc-900/30",
        border: "border-zinc-200/80 dark:border-zinc-800/40",
        label: "Cancelled",
        dot: "bg-zinc-400",
      }
  }
}

export function TicketCard({ ticket }: { ticket: TicketItem }) {
  const style = getTicketStatusStyle(ticket.statusCode)

  return (
    <Link
      href={`/tickets/${ticket.id}`}
      className={cn(
        "group relative flex flex-col justify-between rounded-lg border border-l-4 transition-all duration-200 p-4 shadow-sm hover:shadow-md",
        style.rail,
        style.bg,
        style.border
      )}
    >
      <div>
        {/* Top Header: Ticket Number & Badges */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-mono text-xs font-bold text-primary group-hover:underline">
            {ticket.ticketNumber}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <TicketPriorityBadge priority={ticket.priorityCode} />
            <TicketStatusBadge status={ticket.statusCode} />
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-2.5">
          {ticket.title}
        </h3>

        {/* Device & Location Meta */}
        <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1.5 truncate">
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
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-500" />
              <span className="truncate">
                {ticket.hospital?.name ? `${ticket.hospital.name} / ` : ""}
                {ticket.department?.name || "Unassigned Dept"}
              </span>
            </div>
          )}
        </div>

        {/* Waiting for Spare Parts Pill */}
        {ticket.statusCode === "waiting_parts_vendor" && ticket.waitingReason && (
          <div className="mb-3 rounded bg-orange-100/80 dark:bg-orange-950/60 px-2.5 py-1.5 text-xs text-orange-950 dark:text-orange-200 border border-orange-200 dark:border-orange-800/60 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 shrink-0 text-orange-600 dark:text-orange-400" />
            <span className="truncate font-medium">On Order: {ticket.waitingReason}</span>
          </div>
        )}
      </div>

      {/* Footer: Assignee & Date */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50 mt-1">
        <div className="flex items-center gap-1.5 truncate">
          <User className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <span className="truncate">
            {ticket.assignedEngineer?.fullName ? (
              <span className="text-foreground font-medium">
                {ticket.assignedEngineer.fullName}
              </span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400 font-semibold">
                Unassigned
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] shrink-0">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span>
            {new Date(ticket.reportedAt || ticket.createdAt || Date.now()).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Link>
  )
}
