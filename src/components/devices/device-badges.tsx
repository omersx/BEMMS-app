import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const statusConfig: Record<string, { label: string; variant: string; className: string }> = {
  operational: { label: "Operational", variant: "default", className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800" },
  operational_with_limitations: { label: "Limited Use", variant: "default", className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800" },
  under_maintenance: { label: "Under Maintenance", variant: "default", className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800" },
  under_repair: { label: "Under Repair", variant: "default", className: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800" },
  waiting_for_parts: { label: "Waiting for Parts", variant: "default", className: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800" },
  awaiting_release: { label: "Awaiting Release", variant: "default", className: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800" },
  out_of_service: { label: "Out of Service", variant: "default", className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800" },
  standby: { label: "Standby", variant: "default", className: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700" },
  decommissioned: { label: "Decommissioned", variant: "default", className: "bg-slate-200 text-slate-600 border-slate-300 line-through dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" },
}

const criticalityConfig: Record<string, { label: string; className: string }> = {
  critical: { label: "Critical", className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800" },
  high: { label: "High", className: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800" },
  medium: { label: "Medium", className: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800" },
  low: { label: "Low", className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800" },
}

const riskConfig: Record<string, { label: string; className: string }> = {
  class_i: { label: "Class I", className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800" },
  class_iia: { label: "Class IIa", className: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800" },
  class_iib: { label: "Class IIb", className: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800" },
  class_iii: { label: "Class III", className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800" },
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
