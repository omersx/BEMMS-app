import { DeviceStatusBadge } from "./device-badges"
import { User, Calendar } from "lucide-react"

interface StatusEntry {
  id: string
  previousStatusCode?: string | null
  newStatusCode: string
  reason?: string | null
  notes?: string | null
  effectiveAt: Date | string
  changedByUser?: { fullName: string } | null
}

interface LocationEntry {
  id: string
  newHospital?: { name: string } | null
  newDepartment?: { name: string } | null
  transferReason: string
  notes?: string | null
  effectiveAt: Date | string
  changedByUser?: { fullName: string } | null
}

export function DeviceStatusTimeline({ entries }: { entries: StatusEntry[] }) {
  if (!entries || entries.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No status history recorded.</p>
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
      <div className="space-y-6">
        {entries.map((entry) => (
          <div key={entry.id} className="relative pl-10">
            <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                {entry.previousStatusCode && (
                  <>
                    <DeviceStatusBadge status={entry.previousStatusCode} />
                    <span className="text-muted-foreground">→</span>
                  </>
                )}
                <DeviceStatusBadge status={entry.newStatusCode} />
              </div>
              {entry.reason && (
                <p className="text-sm text-foreground">{entry.reason}</p>
              )}
              {entry.notes && (
                <p className="text-xs text-muted-foreground italic">{entry.notes}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(entry.effectiveAt).toLocaleString()}
                </span>
                {entry.changedByUser && (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {entry.changedByUser.fullName}
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

const transferReasonLabels: Record<string, string> = {
  relocation: "Relocation",
  temporary_loan: "Temporary Loan",
  department_change: "Department Change",
  correction: "Correction",
  replacement: "Replacement",
  workshop: "To Workshop",
  storage: "To Storage",
  other: "Other",
}

export function DeviceLocationTimeline({ entries }: { entries: LocationEntry[] }) {
  if (!entries || entries.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No location history recorded.</p>
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
      <div className="space-y-6">
        {entries.map((entry) => (
          <div key={entry.id} className="relative pl-10">
            <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-background" />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {entry.newHospital?.name || "Unknown Hospital"} — {entry.newDepartment?.name || "Unknown Department"}
              </p>
              <p className="text-xs text-muted-foreground">
                Reason: {transferReasonLabels[entry.transferReason] || entry.transferReason}
              </p>
              {entry.notes && (
                <p className="text-xs text-muted-foreground italic">{entry.notes}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(entry.effectiveAt).toLocaleString()}
                </span>
                {entry.changedByUser && (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {entry.changedByUser.fullName}
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
