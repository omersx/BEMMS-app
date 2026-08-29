import { AlertTriangle, CheckCircle, AlertCircle, Wrench, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

const bannerConfig: Record<string, { icon: any; bg: string; border: string; text: string; message: string }> = {
  operational: {
    icon: CheckCircle, bg: "bg-green-50", border: "border-green-300", text: "text-green-800",
    message: "This device is operational and available for use.",
  },
  operational_with_limitations: {
    icon: AlertTriangle, bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-800",
    message: "This device is operational with limitations. Check notes below before use.",
  },
  under_maintenance: {
    icon: Wrench, bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-800",
    message: "This device is currently under maintenance. Do not use until released by Biomedical Engineering.",
  },
  under_repair: {
    icon: Wrench, bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-800",
    message: "This device is under repair. Do not use until released by Biomedical Engineering.",
  },
  waiting_for_parts: {
    icon: Clock, bg: "bg-yellow-50", border: "border-yellow-300", text: "text-yellow-800",
    message: "This device is waiting for parts. Do not use.",
  },
  awaiting_release: {
    icon: Clock, bg: "bg-purple-50", border: "border-purple-300", text: "text-purple-800",
    message: "This device is awaiting release after maintenance. Do not use until formally released.",
  },
  out_of_service: {
    icon: AlertCircle, bg: "bg-red-50", border: "border-red-300", text: "text-red-800",
    message: "OUT OF SERVICE — Do not use until released by Biomedical Engineering.",
  },
  standby: {
    icon: Clock, bg: "bg-gray-50", border: "border-gray-300", text: "text-gray-800",
    message: "This device is on standby.",
  },
  decommissioned: {
    icon: AlertCircle, bg: "bg-slate-100", border: "border-slate-300", text: "text-slate-600",
    message: "This device has been decommissioned and is no longer in service.",
  },
}

export function DeviceAvailabilityBanner({ status, limitationsNote }: { status: string; limitationsNote?: string | null }) {
  const config = bannerConfig[status] || bannerConfig.operational
  const Icon = config.icon

  return (
    <div className={cn("rounded-lg border-2 p-4 flex items-start gap-3", config.bg, config.border)}>
      <Icon className={cn("w-6 h-6 mt-0.5 flex-shrink-0", config.text)} />
      <div>
        <p className={cn("font-semibold text-base", config.text)}>{config.message}</p>
        {limitationsNote && status === 'operational_with_limitations' && (
          <p className={cn("mt-1 text-sm", config.text)}>Note: {limitationsNote}</p>
        )}
      </div>
    </div>
  )
}
