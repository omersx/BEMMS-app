import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const statusConfig: Record<string, { label: string; className: string }> = {
  new: { label: "New", className: "bg-blue-100 text-blue-800 border-blue-200" },
  acknowledged: { label: "Acknowledged", className: "bg-sky-100 text-sky-800 border-sky-200" },
  in_triage: { label: "Under Assessment", className: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  in_progress: { label: "In Progress", className: "bg-violet-100 text-violet-800 border-violet-200" },
  waiting_requester: { label: "Info Needed", className: "bg-amber-100 text-amber-800 border-amber-200" },
  waiting_parts_vendor: { label: "Waiting Parts", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  resolved: { label: "Resolved", className: "bg-green-100 text-green-800 border-green-200" },
  closed: { label: "Closed", className: "bg-slate-100 text-slate-600 border-slate-200" },
  cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-500 border-gray-200 line-through" },
}

const priorityConfig: Record<string, { label: string; className: string }> = {
  p1_critical: { label: "P1 Critical", className: "bg-red-100 text-red-800 border-red-300 font-bold" },
  p2_high: { label: "P2 High", className: "bg-orange-100 text-orange-800 border-orange-200" },
  p3_normal: { label: "P3 Normal", className: "bg-blue-50 text-blue-700 border-blue-200" },
  p4_low: { label: "P4 Low", className: "bg-gray-50 text-gray-600 border-gray-200" },
}

const impactConfig: Record<string, { label: string; className: string }> = {
  device_usable: { label: "Device Usable", className: "bg-green-50 text-green-700 border-green-200" },
  device_not_usable: { label: "Device Not Usable", className: "bg-orange-50 text-orange-700 border-orange-200" },
  patient_care_affected: { label: "Patient Care Affected", className: "bg-red-50 text-red-800 border-red-300 font-bold" },
}

export function TicketStatusBadge({ status }: { status?: string | null }) {
  const config = statusConfig[status || ''] || { label: status || 'Unknown', className: 'bg-muted text-muted-foreground' }
  return <Badge variant="outline" className={cn("font-medium", config.className)}>{config.label}</Badge>
}

export function TicketPriorityBadge({ priority }: { priority?: string | null }) {
  const config = priorityConfig[priority || ''] || { label: priority || 'N/A', className: 'bg-muted text-muted-foreground' }
  return <Badge variant="outline" className={cn("font-medium text-xs", config.className)}>{config.label}</Badge>
}

export function TicketImpactBadge({ impact }: { impact?: string | null }) {
  const config = impactConfig[impact || ''] || { label: impact || 'N/A', className: 'bg-muted text-muted-foreground' }
  return <Badge variant="outline" className={cn("font-medium text-xs", config.className)}>{config.label}</Badge>
}
