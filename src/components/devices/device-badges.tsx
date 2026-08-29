import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const statusConfig: Record<string, { label: string; variant: string; className: string }> = {
  operational: { label: "Operational", variant: "default", className: "bg-green-100 text-green-800 border-green-200" },
  operational_with_limitations: { label: "Limited Use", variant: "default", className: "bg-amber-100 text-amber-800 border-amber-200" },
  under_maintenance: { label: "Under Maintenance", variant: "default", className: "bg-blue-100 text-blue-800 border-blue-200" },
  under_repair: { label: "Under Repair", variant: "default", className: "bg-orange-100 text-orange-800 border-orange-200" },
  waiting_for_parts: { label: "Waiting for Parts", variant: "default", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  awaiting_release: { label: "Awaiting Release", variant: "default", className: "bg-purple-100 text-purple-800 border-purple-200" },
  out_of_service: { label: "Out of Service", variant: "default", className: "bg-red-100 text-red-800 border-red-200" },
  standby: { label: "Standby", variant: "default", className: "bg-gray-100 text-gray-800 border-gray-200" },
  decommissioned: { label: "Decommissioned", variant: "default", className: "bg-slate-200 text-slate-600 border-slate-300 line-through" },
}

const criticalityConfig: Record<string, { label: string; className: string }> = {
  critical: { label: "Critical", className: "bg-red-100 text-red-800 border-red-200" },
  high: { label: "High", className: "bg-orange-100 text-orange-800 border-orange-200" },
  medium: { label: "Medium", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  low: { label: "Low", className: "bg-green-100 text-green-800 border-green-200" },
}

const riskConfig: Record<string, { label: string; className: string }> = {
  class_i: { label: "Class I", className: "bg-green-50 text-green-700 border-green-200" },
  class_iia: { label: "Class IIa", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  class_iib: { label: "Class IIb", className: "bg-orange-50 text-orange-700 border-orange-200" },
  class_iii: { label: "Class III", className: "bg-red-50 text-red-700 border-red-200" },
}

export function DeviceStatusBadge({ status }: { status?: string | null }) {
  const config = statusConfig[status || ''] || { label: status || 'Unknown', variant: 'secondary', className: 'bg-muted text-muted-foreground' }
  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  )
}

export function CriticalityBadge({ level }: { level?: string | null }) {
  const config = criticalityConfig[level || ''] || { label: level || 'N/A', className: 'bg-muted text-muted-foreground' }
  return (
    <Badge variant="outline" className={cn("font-medium text-xs", config.className)}>
      {config.label}
    </Badge>
  )
}

export function RiskClassBadge({ classification }: { classification?: string | null }) {
  const config = riskConfig[classification || ''] || { label: classification || 'N/A', className: 'bg-muted text-muted-foreground' }
  return (
    <Badge variant="outline" className={cn("font-medium text-xs", config.className)}>
      {config.label}
    </Badge>
  )
}
