import { TicketStatusBadge, TicketPriorityBadge } from "./ticket-badges"
import { DeviceStatusBadge } from "@/components/devices/device-badges"
import { User, Calendar } from "lucide-react"

const eventTypeLabels: Record<string, string> = {
  created: "Ticket Created",
  acknowledged: "Acknowledged",
  triaged: "Triaged",
  assigned: "Assigned to Engineer",
  reassigned: "Reassigned",
  accepted: "Accepted by Engineer",
  status_changed: "Status Changed",
  priority_changed: "Priority Changed",
  waiting_for_info: "Waiting for Information",
  info_received: "Information Received",
  maintenance_task_linked: "Maintenance Task Linked",
  resolved: "Resolved",
  closed: "Closed",
  cancelled: "Cancelled",
  reopened: "Reopened",
}

function getEventDotClass(eventType: string): string {
  switch (eventType) {
    case 'status_changed':
      // Amber/Orange for status updates
      return 'bg-amber-500 ring-4 ring-amber-100 dark:ring-amber-950/60'
    case 'waiting_for_info':
      return 'bg-yellow-500 ring-4 ring-yellow-100 dark:ring-yellow-950/60'
    case 'reopened':
      return 'bg-orange-500 ring-4 ring-orange-100 dark:ring-orange-950/60'
    case 'resolved':
      return 'bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-950/60'
    case 'closed':
      return 'bg-slate-600 ring-4 ring-slate-100 dark:ring-slate-800'
    case 'cancelled':
      return 'bg-rose-400 ring-4 ring-rose-100 dark:ring-rose-950/60'
    case 'created':
      return 'bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-950/60'
    case 'acknowledged':
    case 'triaged':
      return 'bg-sky-500 ring-4 ring-sky-100 dark:ring-sky-950/60'
    case 'assigned':
    case 'reassigned':
      return 'bg-violet-500 ring-4 ring-violet-100 dark:ring-violet-950/60'
    case 'accepted':
      return 'bg-indigo-500 ring-4 ring-indigo-100 dark:ring-indigo-950/60'
    default:
      return 'bg-amber-500 ring-4 ring-amber-100 dark:ring-amber-950/60'
  }
}

interface TimelineEntry {
  id: string
  eventType: string
  previousValueJsonb?: any
  newValueJsonb?: any
  reason?: string | null
  visibility: string
  actor?: { fullName: string } | null
  createdAt: Date | string
}

export function TicketTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (!entries || entries.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No timeline events recorded.</p>
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
      <div className="space-y-6">
        {entries.map((entry) => (
          <div key={entry.id} className="relative pl-10">
            <div
              className={`absolute left-2.5 top-1.5 w-3 h-3 rounded-full border-2 border-background ${getEventDotClass(
                entry.eventType
              )}`}
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">
                  {eventTypeLabels[entry.eventType] || entry.eventType}
                </span>
                {entry.visibility === 'internal' && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                    Internal
                  </span>
                )}
              </div>
              {entry.reason && (
                <p className="text-sm text-foreground">{entry.reason}</p>
              )}
              {entry.newValueJsonb && typeof entry.newValueJsonb === 'object' && (
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  {entry.newValueJsonb.statusCode && (
                    <TicketStatusBadge status={entry.newValueJsonb.statusCode} />
                  )}
                  {entry.newValueJsonb.deviceStatusCode && (
                    <DeviceStatusBadge status={entry.newValueJsonb.deviceStatusCode} />
                  )}
                  {entry.newValueJsonb.priorityCode && (
                    <TicketPriorityBadge priority={entry.newValueJsonb.priorityCode} />
                  )}
                  {entry.newValueJsonb.partName && (
                    <span className="text-xs bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded font-medium inline-flex items-center gap-1">
                      📦 {entry.newValueJsonb.partName}
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(entry.createdAt).toLocaleString()}
                </span>
                {entry.actor && (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {entry.actor.fullName}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
