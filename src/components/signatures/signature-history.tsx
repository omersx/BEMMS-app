"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Lock, ArrowRight, History } from "lucide-react"

export interface SignatureEventItem {
  id: string
  eventType: string
  actorUserId?: string
  timestamp: Date | string
  previousStatus?: string | null
  newStatus?: string | null
  reason?: string | null
  currentEventHash: string
  previousEventHash?: string | null
}

export interface SignatureHistoryProps {
  events: SignatureEventItem[]
  className?: string
}

const EVENT_COLORS: Record<string, string> = {
  created: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  rejected: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  amended: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
  voided: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800",
  reviewed: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
}

const formatTime = (date: Date | string) => {
  const d = new Date(date)
  return d.toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })
}

function truncateHash(hash: string) {
  if (!hash || hash.length < 16) return hash
  return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`
}

export function SignatureHistory({ events, className }: SignatureHistoryProps) {
  // Sort from newest to oldest
  const sortedEvents = [...events].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })

  if (sortedEvents.length === 0) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        <History className="mx-auto h-8 w-8 opacity-40 mb-2" />
        <p className="text-sm">No signature events recorded.</p>
      </div>
    )
  }

  return (
    <div className={cn("relative space-y-0 ml-3 sm:ml-4 border-l-2 border-muted", className)}>
      {sortedEvents.map((event, idx) => {
        const isLast = idx === sortedEvents.length - 1
        const eventTypeClass = EVENT_COLORS[event.eventType.toLowerCase()] || 
          "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
          
        return (
          <div key={event.id} className="relative pl-6 sm:pl-8 pb-8 last:pb-0 group">
            {/* Timeline Dot */}
            <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-border ring-4 ring-background group-hover:bg-primary transition-colors" />
            
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={cn("capitalize text-[10px] font-semibold tracking-wide", eventTypeClass)}>
                  {event.eventType}
                </Badge>
                <span className="text-xs text-muted-foreground font-medium">
                  {formatTime(event.timestamp)}
                </span>
              </div>
              
              {event.previousStatus && event.newStatus && (
                <div className="flex items-center gap-2 text-sm text-foreground/80">
                  <span className="capitalize">{event.previousStatus}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="capitalize font-medium text-foreground">{event.newStatus}</span>
                </div>
              )}
              
              {event.reason && (
                <p className="text-sm text-foreground bg-muted/40 p-2.5 rounded-md border border-border/50">
                  <span className="font-semibold text-xs text-muted-foreground block mb-1 uppercase tracking-wider">Reason</span>
                  {event.reason}
                </p>
              )}
              
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70 font-mono mt-1">
                <Lock className="h-3 w-3" />
                <span title={event.currentEventHash}>Hash: {truncateHash(event.currentEventHash)}</span>
                {event.previousEventHash && (
                  <span title={event.previousEventHash}>
                    <ArrowRight className="h-2.5 w-2.5 inline mx-1" /> 
                    {truncateHash(event.previousEventHash)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
