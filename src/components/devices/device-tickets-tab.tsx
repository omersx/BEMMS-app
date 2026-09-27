"use client"

import Link from "next/link"
import { Ticket, Plus, AlertCircle, Clock, CheckCircle2, User, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TicketStatusBadge, TicketPriorityBadge } from "@/components/tickets/ticket-badges"

interface DeviceTicketsTabProps {
  tickets: any[]
  deviceId: string
  deviceName: string
}

export function DeviceTicketsTab({ tickets = [], deviceId, deviceName }: DeviceTicketsTabProps) {
  const total = tickets.length
  const openCount = tickets.filter(t => !["resolved", "closed", "cancelled"].includes(t.statusCode)).length
  const inProgressCount = tickets.filter(t => t.statusCode === "in_progress").length
  const resolvedCount = tickets.filter(t => ["resolved", "closed"].includes(t.statusCode)).length

  return (
    <div className="space-y-6">
      {/* 1. Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold">{total}</span>
          <span className="text-xs text-muted-foreground mt-0.5">Total Tickets</span>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold text-amber-600">{openCount}</span>
          <span className="text-xs text-muted-foreground mt-0.5">Open / Active</span>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold text-blue-600">{inProgressCount}</span>
          <span className="text-xs text-muted-foreground mt-0.5">In Progress</span>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold text-emerald-600">{resolvedCount}</span>
          <span className="text-xs text-muted-foreground mt-0.5">Resolved / Closed</span>
        </Card>
      </div>

      {/* 2. Ticket History Section Header & Action */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Service &amp; Problem History</h3>
          <p className="text-xs text-muted-foreground">
            All incident reports and service tickets submitted for this device
          </p>
        </div>
        <Button asChild size="sm" className="gap-1.5">
          <Link href={`/tickets/create?deviceId=${deviceId}&source=device_profile`}>
            <Plus className="w-4 h-4" />
            Report a Problem
          </Link>
        </Button>
      </div>

      {/* 3. Ticket List */}
      {tickets.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20 space-y-3">
          <Ticket className="w-12 h-12 text-muted-foreground mx-auto opacity-40" />
          <div>
            <h4 className="text-sm font-medium text-foreground">No Tickets Reported</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              This equipment currently has no reported problems or maintenance tickets in the registry.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link href={`/tickets/create?deviceId=${deviceId}&source=device_profile`}>
              <Plus className="w-4 h-4 mr-1.5" />
              Report First Ticket
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const reportedDate = ticket.reportedAt || ticket.createdAt
            const formattedDate = reportedDate
              ? new Date(reportedDate).toISOString().replace("T", " ").substring(0, 16)
              : "Unknown date"

            return (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="block group"
              >
                <Card className="transition-all hover:border-primary/50 hover:shadow-xs">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Info */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-semibold text-primary">
                            {ticket.ticketNumber}
                          </span>
                          <TicketPriorityBadge priority={ticket.priorityCode} />
                          <TicketStatusBadge status={ticket.statusCode} />
                        </div>
                        <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {ticket.title}
                        </h4>
                        {ticket.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {ticket.description}
                          </p>
                        )}
                      </div>

                      {/* Right: Meta & Arrow */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center text-xs text-muted-foreground shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 gap-1.5">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span suppressHydrationWarning>{formattedDate} UTC</span>
                        </div>
                        {ticket.assignedEngineer?.fullName && (
                          <div className="flex items-center gap-1 text-foreground/80">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{ticket.assignedEngineer.fullName}</span>
                          </div>
                        )}
                        <span className="text-primary group-hover:translate-x-0.5 transition-transform hidden sm:inline-flex items-center gap-0.5 text-xs font-medium">
                          View details <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
