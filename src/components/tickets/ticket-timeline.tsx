import { TicketStatusBadge, TicketPriorityBadge } from "./ticket-badges"
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
            <div className={`absolute left-2.5 top-1.5 w-3 h-3 rounded-full border-2 border-background ${
              entry.eventType === 'resolved' ? 'bg-green-500' :
              entry.eventType === 'cancelled' ? 'bg-gray-400' :
              entry.eventType === 'created' ? 'bg-blue-500' :
              entry.eventType === 'assigned' || entry.eventType === 'reassigned' ? 'bg-violet-500' :
              'bg-primary'
            }`} />
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
                <div className="flex items-center gap-2 flex-wrap">
                  {entry.newValueJsonb.statusCode && (
                    <TicketStatusBadge status={entry.newValueJsonb.statusCode} />
                  )}
                  {entry.newValueJsonb.priorityCode && (
                    <TicketPriorityBadge priority={entry.newValueJsonb.priorityCode} />
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
